const { User, sequelize } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { getSignedUrlForUpload, getTemporarySignedUrl } = require('../../utils/s3SignedUrl.utils');
const s3Client = require('../../config/s3.config');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const {
  DESIGNATION_MODEL_VALUES,
  DEPARTMENT_MODEL_VALUES,
  EMPLOYEE_STATUS_VALUES,
  USER_ROLE_VALUES,
  DEFAULTS,
} = require('../../constants');

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


      const existingUser = await User.findOne({
        where: { [Op.or]: [{ email }, { employeeId }] },
        transaction,
      });

      if (existingUser) {
        throw new Error('User already exists with this email or employee ID');
      }

      if (!DESIGNATION_MODEL_VALUES.includes(designation)) {
        throw new Error(
          `Invalid designation. Allowed: ${DESIGNATION_MODEL_VALUES.join(', ')}`
        );
      }

      if (!DEPARTMENT_MODEL_VALUES.includes(department)) {
        throw new Error(
          `Invalid department. Allowed: ${DEPARTMENT_MODEL_VALUES.join(', ')}`
        );
      }

      if (!EMPLOYEE_STATUS_VALUES.includes(status)) {
        throw new Error(
          `Invalid status. Allowed: ${EMPLOYEE_STATUS_VALUES.join(', ')}`
        );
      }

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

      const userObj = user.toJSON();
      delete userObj.password;

      // Format timestamps to local date string (YYYY-MM-DD format)
      // This ensures consistent date display regardless of timezone
      if (userObj.createdAt) {
        userObj.createdAt = new Date(userObj.createdAt).toISOString();
      }
      if (userObj.updatedAt) {
        userObj.updatedAt = new Date(userObj.updatedAt).toISOString();
      }

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
        const employeeObj = employee.toJSON();
        delete employeeObj.password;

        // Generate signed URL if profile picture key exists
        if (employeeObj.profilePictureKey) {
          try {
            employeeObj.profilePictureUrl = await getTemporarySignedUrl(employeeObj.profilePictureKey);
          } catch (error) {
            console.error(`Error generating signed URL for employee ${employeeObj.id}:`, error);
            employeeObj.profilePictureUrl = null;
          }
        } else {
          employeeObj.profilePictureUrl = null;
        }

        // Format timestamps to ISO string
        if (employeeObj.createdAt) {
          employeeObj.createdAt = new Date(employeeObj.createdAt).toISOString();
        }
        if (employeeObj.updatedAt) {
          employeeObj.updatedAt = new Date(employeeObj.updatedAt).toISOString();
        }

        return employeeObj;
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

    const employeeObj = employee.toJSON();
    delete employeeObj.password;

    if (employeeObj.profilePictureKey) {
      employeeObj.profilePictureUrl = await getTemporarySignedUrl(employeeObj.profilePictureKey);
    } else {
      employeeObj.profilePictureUrl = null;
    }

    return employeeObj;
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
      if (employee.profilePictureKey) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: employee.profilePictureKey,
            })
          );
        } catch (s3Error) {
          console.error(`Error deleting profile picture from S3 for employee ${id}:`, s3Error);
          // Continue with user deletion even if S3 deletion fails
        }
      }

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
}

module.exports = new UserService();



