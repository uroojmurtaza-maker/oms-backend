const { User, sequelize } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const s3Client = require('../../config/s3.config');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('../../utils/s3SignedUrl.utils');
const {
  DESIGNATION_MODEL_VALUES,
  DEPARTMENT_MODEL_VALUES,
  EMPLOYEE_STATUS_VALUES,
  USER_ROLE_VALUES,
  DEFAULTS,
} = require('../../constants');

class UserService {
  async createUser(userData, profileImageFile = null) {

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
          status,
          role,
        },
        { transaction }
      );


      /*
        At this point:
        - User exists ONLY inside transaction
        - If rollback happens → user disappears
      */

      // 5️⃣ UPLOAD TO S3
      let profilePictureKey = null;

      if (profileImageFile) {

        profilePictureKey = `profiles/${user.id}-${Date.now()}-${profileImageFile.originalname}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: profilePictureKey,
            Body: profileImageFile.buffer,
            ContentType: profileImageFile.mimetype,
            ACL: 'private',
          })
        );


        await user.update(
          { profilePictureKey },
          { transaction }
        );
      }

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

  async getEmployees() {
    const employees = await User.findAll({ where: { role: 'Employee' } });

    // Generate signed URLs for profile pictures
    const employeesWithSignedUrls = await Promise.all(
      employees.map(async (employee) => {
        const employeeObj = employee.toJSON();
        delete employeeObj.password;

        // Generate signed URL if profile picture key exists
        if (employeeObj.profilePictureKey) {
          try {
            employeeObj.profilePictureUrl = await getSignedUrl(employeeObj.profilePictureKey);
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

    return employeesWithSignedUrls;
  }
}

module.exports = new UserService();



