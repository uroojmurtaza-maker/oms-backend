const { Op } = require('sequelize');
const { User } = require('../../models');
const { getTemporarySignedUrl } = require('../../utils/s3SignedUrl.utils');
const s3Client = require('../../config/s3.config');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const {
  DESIGNATION_MODEL_VALUES,
  DEPARTMENT_MODEL_VALUES,
  EMPLOYEE_STATUS_VALUES,
} = require('../../constants');

/**
 * Format user object: remove password, format timestamps, generate profile picture URL
 * @param {Object} userObj - User object from database
 * @param {string} userId - User ID for error logging
 * @returns {Promise<Object>} Formatted user object
 */
async function formatUserObject(userObj, userId = null) {
  const formatted = { ...userObj };

  // Remove password
  delete formatted.password;

  // Format timestamps to ISO string
  if (formatted.createdAt) {
    formatted.createdAt = new Date(formatted.createdAt).toISOString();
  }
  if (formatted.updatedAt) {
    formatted.updatedAt = new Date(formatted.updatedAt).toISOString();
  }

  // Generate signed URL for profile picture if it exists
  if (formatted.profilePictureKey) {
    try {
      formatted.profilePictureUrl = await getTemporarySignedUrl(formatted.profilePictureKey);
    } catch (error) {
      const logId = userId || formatted.id || 'unknown';
      console.error(`Error generating signed URL for user ${logId}:`, error);
      formatted.profilePictureUrl = null;
    }
  } else {
    formatted.profilePictureUrl = null;
  }

  return formatted;
}

/**
 * Validate enum fields (designation, department, status)
 * @param {Object} data - Object containing fields to validate
 * @throws {Error} If validation fails
 */
function validateEnumFields(data) {
  const { designation, department, status ,role} = data;

  if (designation && !DESIGNATION_MODEL_VALUES.includes(designation)) {
    throw new Error(
      `Invalid designation. Allowed: ${DESIGNATION_MODEL_VALUES.join(', ')}`
    );
  }

  if (department && !DEPARTMENT_MODEL_VALUES.includes(department)) {
    throw new Error(
      `Invalid department. Allowed: ${DEPARTMENT_MODEL_VALUES.join(', ')}`
    );
  }

  if (status && !EMPLOYEE_STATUS_VALUES.includes(status)) {
    throw new Error(
      `Invalid status. Allowed: ${EMPLOYEE_STATUS_VALUES.join(', ')}`
    );
  }
  if (role && !USER_ROLE_VALUES.includes(role)) {
    throw new Error(
      `Invalid role. Allowed: ${USER_ROLE_VALUES.join(', ')}`
    );
  }
}

/**
 * Check for email and employeeId conflicts
 * @param {Object} params - Parameters object
 * @param {string} params.email - Email to check
 * @param {string} params.employeeId - Employee ID to check
 * @param {string} params.excludeUserId - User ID to exclude from check
 * @param {Object} params.transaction - Sequelize transaction (optional)
 * @throws {Error} If conflict exists
 */
async function checkUserConflicts({ email, employeeId, excludeUserId = null, transaction = null }) {
  if (!email && !employeeId) {
    return; // No fields to check
  }

  const conflictConditions = [];
  if (email) conflictConditions.push({ email });
  if (employeeId) conflictConditions.push({ employeeId });

  const whereClause = {
    [Op.or]: conflictConditions,
  };

  // Exclude current user if provided
  if (excludeUserId) {
    whereClause[Op.and] = [
      { [Op.or]: conflictConditions },
      { id: { [Op.ne]: excludeUserId } },
    ];
  }

  const queryOptions = { where: whereClause };
  if (transaction) {
    queryOptions.transaction = transaction;
  }

  const existingUser = await User.findOne(queryOptions);

  if (existingUser) {
    const conflictFields = [];
    if (email && existingUser.email === email) conflictFields.push('email');
    if (employeeId && existingUser.employeeId === employeeId) conflictFields.push('employee ID');

    throw new Error(`User already exists with this ${conflictFields.join(' or ')}`);
  }
}

/**
 * Delete profile picture from S3
 * @param {string} profilePictureKey - S3 key of the profile picture
 * @param {string} userId - User ID for error logging
 */
async function deleteProfilePictureFromS3(profilePictureKey, userId = 'unknown') {
  if (!profilePictureKey) {
    return;
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: profilePictureKey,
      })
    );
  } catch (s3Error) {
    console.error(`Error deleting profile picture from S3 for user ${userId}:`, s3Error);
    // Don't throw error - continue even if S3 deletion fails
  }
}

/**
 * Handle profile picture update: delete old image if new one is provided
 * @param {string} oldProfilePictureKey - Old profile picture key
 * @param {string} newProfilePictureKey - New profile picture key
 * @param {string} userId - User ID for error logging
 */
async function handleProfilePictureUpdate(oldProfilePictureKey, newProfilePictureKey, userId = 'unknown') {
  if (newProfilePictureKey && oldProfilePictureKey && oldProfilePictureKey !== newProfilePictureKey) {
    await deleteProfilePictureFromS3(oldProfilePictureKey, userId);
  }
}

/**
 * Prepare update data object from provided fields
 * @param {Object} data - Data object with fields to update
 * @param {Array<string>} allowedFields - Array of allowed field names
 * @returns {Object} Update data object
 */
function prepareUpdateData(data, allowedFields = []) {
  const updateData = {};

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  return updateData;
}

module.exports = {
  formatUserObject,
  validateEnumFields,
  checkUserConflicts,
  deleteProfilePictureFromS3,
  handleProfilePictureUpdate,
  prepareUpdateData,
};
