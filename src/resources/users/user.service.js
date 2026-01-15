const { User, sequelize } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { getSignedUrlForUpload } = require('../../utils/s3SignedUrl.utils');
const {
  DESIGNATION_MODEL_VALUES,
  DEPARTMENT_MODEL_VALUES,
  USER_ROLE_VALUES,
  DEFAULTS,
} = require('../../constants');
const {
  formatUserObject,
  validateEnumFields,
  checkUserConflicts,
  deleteProfilePictureFromS3,
  handleProfilePictureUpdate,
  prepareUpdateData,
} = require('./user.helpers');

class UserService {
  async createUser(userData) {

    const transaction = await sequelize.transaction();

    try {
      const {
        name,
        email,
        password,
        designation,
        department,
        dateOfBirth,
        employeeId,
        salary,
        joiningDate,
        phoneNumber,
        profilePictureKey,
        status = DEFAULTS.STATUS,
        role = DEFAULTS.ROLE,
      } = userData;

      console.log('🧪 Validating user data');
      if (!name || !email || !password || !designation || !department || !employeeId || !joiningDate) {
        throw new Error('Missing required fields');
      }


      // Check for user conflicts
      await checkUserConflicts({ email, employeeId, transaction });

      // Validate enum fields
      validateEnumFields({ designation, department, status });

      if (!USER_ROLE_VALUES.includes(role)) {
        throw new Error(`Invalid role. Allowed: ${USER_ROLE_VALUES.join(', ')}`);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create(
        {
          name,
          email,
          password: hashedPassword,
          designation,
          department,
          dateOfBirth,
          employeeId,
          salary,
          joiningDate,
          phoneNumber,
          profilePictureKey: profilePictureKey || null,
          status,
          role,
        },
        { transaction }
      );

      await transaction.commit();

      const userObj = await formatUserObject(user.toJSON(), user.id);

      console.log('🎉 User creation completed successfully');

      return userObj;

    } catch (error) {
      console.error('❌ Error occurred during user creation:', error.message);

      await transaction.rollback();


      throw error;
    }
  }

  async getProfilePresignedUrl({ fileName, fileType }) {
    const key = `profiles/${Date.now()}-${fileName}`;  // User ID nahi hai abhi, to Date.now() use kiya

    const url = await getSignedUrlForUpload({
      key,
      contentType: fileType,
      expiresIn: 900  // 15 minutes
    });

    return {
      uploadUrl: url,
      key: key
    };
  }

  async getEmployees(page = 1, limit = 10, search = '', department = '', designation = '', sortBy = '', sortOrder = 'asc', currentUserId = null) {
    const pageNumber = Math.max(1, parseInt(page, 10)) || 1;
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10))) || 10; // Max 100 items per page
    const offset = (pageNumber - 1) * pageSize;

    // Build where clause
    const whereClause = { role: 'Employee' };

    // Exclude current user from results
    if (currentUserId) {
      whereClause.id = { [Op.ne]: currentUserId };
    }

    // Add department filter if provided
    if (department && department.trim()) {
      const departmentValue = department.trim();
      if (DEPARTMENT_MODEL_VALUES.includes(departmentValue)) {
        whereClause.department = departmentValue;
      }
    }

    // Add designation filter if provided
    if (designation && designation.trim()) {
      const designationValue = designation.trim();
      if (DESIGNATION_MODEL_VALUES.includes(designationValue)) {
        whereClause.designation = designationValue;
      }
    }

    // Add search condition if search term is provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { email: { [Op.iLike]: searchTerm } },
      ];
    }

    // Build order clause
    const validSortFields = ['name', 'department', 'joiningDate'];
    const validSortOrders = ['asc', 'desc', 'ASC', 'DESC'];

    let orderClause = [['createdAt', 'DESC']]; // Default order

    if (sortBy && sortBy.trim() && validSortFields.includes(sortBy.trim())) {
      const field = sortBy.trim();
      const order = validSortOrders.includes(sortOrder) ? sortOrder.toUpperCase() : 'ASC';
      orderClause = [[field, order]];
    }

    // Get paginated employees with total count
    const { count, rows: employees } = await User.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: offset,
      order: orderClause,
    });


    // Generate signed URLs for profile pictures
    const employeesWithSignedUrls = await Promise.all(
      employees.map(async (employee) => {
        return await formatUserObject(employee.toJSON(), employee.id);
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return {
      employees: employeesWithSignedUrls,
      pagination: {
        total: count,
        page: pageNumber,
        limit: pageSize,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async getEmployeeById(id) {
    const employee = await User.findOne({
      where: { id, role: 'Employee' },
    });
    if (!employee) {
      throw new Error('Employee not found');
    }

    return await formatUserObject(employee.toJSON(), employee.id);
  }


  async deleteEmployee(id) {
    const transaction = await sequelize.transaction();

    try {
      // Find the employee
      const employee = await User.findOne({
        where: { id, role: 'Employee' },
        transaction,
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Delete profile picture from S3 if it exists
      await deleteProfilePictureFromS3(employee.profilePictureKey, id);

      // Delete the employee from database
      await employee.destroy({ transaction });

      await transaction.commit();

      return {
        message: 'Employee deleted successfully',
        id: id,
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  async updateEmployee(id, employeeData) {
    const transaction = await sequelize.transaction();

    try {
      // Find the employee
      const employee = await User.findOne({
        where: { id, role: 'Employee' },
        transaction,
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const {
        name,
        email,
        password,
        designation,
        department,
        dateOfBirth,
        employeeId,
        salary,
        joiningDate,
        phoneNumber,
        profilePictureKey,
        status,
      } = employeeData;

      // Validate enum fields
      validateEnumFields({ designation, department, status });

      // Check for user conflicts
      await checkUserConflicts({ email, employeeId, excludeUserId: id, transaction });

      // Handle profile picture update: delete old image if new one is provided
      await handleProfilePictureUpdate(employee.profilePictureKey, profilePictureKey, id);

      // Prepare update data
      const updateData = prepareUpdateData(employeeData, [
        'name', 'email', 'designation', 'department', 'dateOfBirth',
        'employeeId', 'salary', 'joiningDate', 'phoneNumber',
        'profilePictureKey', 'status'
      ]);

      // Hash password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Update the employee
      await employee.update(updateData, { transaction });
      await transaction.commit();

      return await formatUserObject(employee.toJSON(), id);
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating employee:', error);
      throw error;
    }
  }


  async getProfile(currentUserId) {
    try {
      const user = await User.findOne({ where: { id: currentUserId } });

      if (!user) {
        throw new Error('User not found');
      }

      return await formatUserObject(user.toJSON(), currentUserId);
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  async updateProfile(currentUserId, profileData) {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findOne({
        where: { id: currentUserId },
        transaction
      });

      if (!user) {
        throw new Error('User not found');
      }

      const {
        name,
        email,
        designation,
        department,
        dateOfBirth,
        employeeId,
        salary,
        joiningDate,
        phoneNumber,
        profilePictureKey,
        status,
      } = profileData;

      // Validate enum fields
      validateEnumFields({ designation, department, status });

      // Check for user conflicts
      await checkUserConflicts({ email, employeeId, excludeUserId: currentUserId, transaction });

      // Handle profile picture update: delete old image if new one is provided
      await handleProfilePictureUpdate(user.profilePictureKey, profilePictureKey, currentUserId);

      // Prepare update data - allow updating all fields except id, password, and role
      const updateData = prepareUpdateData(profileData, [
        'name', 'email', 'designation', 'department', 'dateOfBirth',
        'employeeId', 'salary', 'joiningDate', 'phoneNumber',
        'profilePictureKey', 'status'
      ]);

      // Update the user
      await user.update(updateData, { transaction });
      await transaction.commit();

      return await formatUserObject(user.toJSON(), currentUserId);
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}

module.exports = new UserService();



