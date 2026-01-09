const { User, sequelize } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const s3Client = require('../../config/s3.config');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const {
  DESIGNATION_MODEL_VALUES,
  DEPARTMENT_MODEL_VALUES,
  EMPLOYEE_STATUS_VALUES,
  USER_ROLE_VALUES,
  DEFAULTS,
} = require('../../constants');

class UserService {
  async createUser(userData, profileImageFile = null) {
    console.log('🚀 Starting createUser process');

    // 🔐 START TRANSACTION
    const transaction = await sequelize.transaction();
    console.log('🔐 Sequelize transaction started');

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

      // 1️⃣ VALIDATION
      console.log('🧪 Validating user data');
      if (!name || !email || !password || !designation || !department || !employeeId || !joiningDate) {
        throw new Error('Missing required fields');
      }

      // 2️⃣ DUPLICATE CHECK
      console.log('🔍 Checking for existing user');
      const existingUser = await User.findOne({
        where: { [Op.or]: [{ email }, { employeeId }] },
        transaction,
      });

      if (existingUser) {
        throw new Error('User already exists with this email or employee ID');
      }

      // Validate enums using constants
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
      // 3️⃣ HASH PASSWORD
      console.log('🔐 Hashing password');
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4️⃣ CREATE USER (BEFORE S3)
      console.log('📝 Creating user in DB (NOT committed yet)');
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

      console.log(`✅ User created with ID ${user.id} (inside transaction)`);

      /*
        At this point:
        - User exists ONLY inside transaction
        - If rollback happens → user disappears
      */

      // 5️⃣ UPLOAD TO S3
      let profilePictureKey = null;

      if (profileImageFile) {
        console.log('☁️ Starting S3 upload');

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

        console.log('✅ S3 upload successful');

        // 6️⃣ UPDATE USER WITH S3 KEY
        console.log('📝 Updating user with S3 key');
        await user.update(
          { profilePictureKey },
          { transaction }
        );
      } else {
        console.log('ℹ️ No profile image provided, skipping S3 upload');
      }

      // 7️⃣ COMMIT TRANSACTION
      await transaction.commit();
      console.log('✅ Transaction committed successfully');

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

      console.log('↩️ Rolling back transaction');
      await transaction.rollback();

      console.log('🗑️ Transaction rolled back — user creation undone');

      throw error;
    }
  }
}

module.exports = new UserService();



// const { User } = require('../../models')
// const { Op } = require('sequelize')
// const { getSignedUrl } = require('../../utils/s3SignedUrl.utils')
// const bcrypt = require('bcrypt')

// class UserService {
//   async createUser(userData, profileImageFile = null) {
//     const {
//       name,
//       email,
//       password,
//       designation,
//       department,
//       dateOfBirth,
//       employeeId,
//       salary,
//       joiningDate,
//       phoneNumber,
//       status = "Current Employee",
//       role = "Employee"
//     } = userData;

//     // Basic validation
//     if (!name || !email || !password || !designation || !department || !employeeId || !joiningDate) {
//       throw new Error('Missing required fields');
//     }

//     // Enum validation
//     const enums = {
//       designation: ['Manager', 'Developer', 'Designer', 'HR'],
//       department: ['Engineering', 'Sales', 'Marketing', 'HR'],
//       status: ['Current Employee', 'Old Employee'],
//       role: ['Employee']
//     }

//     for (const [key, allowed] of Object.entries(enums)) {
//       if (!allowed.includes(eval(key))) {
//         throw new Error(`Invalid ${key}. Allowed: ${allowed.join(', ')}`)
//       }
//     }


//     // Check for duplicates
//     const existingUser = await User.findOne({
//       where: { [Op.or]: [{ email }, { employeeId }] }
//     });
//     if (existingUser) {
//       throw new Error('User already exists with this email or employee ID');
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Get S3 key from uploaded file (if any)
//     let profilePictureKey = null;
//     if (profileImageFile) {
//       profilePictureKey = profileImageFile.key; // e.g., "profiles/1234567890-photo.jpg"
//     }

//     // Create user in DB — save ONLY the S3 key, NOT the full URL
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       designation,
//       department,
//       dateOfBirth,
//       employeeId,
//       salary,
//       joiningDate,
//       phoneNumber,
//       status,
//       role,
//       profilePictureKey,
//     });

//     // Generate signed URL for immediate display
//     let profilePictureUrl = null;
//     if (profilePictureKey) {
//       profilePictureUrl = await getSignedUrl(profilePictureKey);
//     }

//     // Convert to plain object and add virtual field
//     const userObj = user.toJSON();
//     userObj.profilePictureUrl = profilePictureUrl;  // ← Temporary signed URL

//     delete userObj.password;

//     return userObj;
//   }
// }

// module.exports = new UserService()