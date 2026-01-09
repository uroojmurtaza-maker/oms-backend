// src/utils/s3SignedUrl.js
const { getSignedUrl: getPresignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3.config');

const getSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key, // e.g., profiles/1640995200000-photo.jpg
  });

  // URL valid for 1 hour (3600 seconds)
  return await getPresignedUrl(s3Client, command, { expiresIn: 3600 });
};

module.exports = { getSignedUrl };