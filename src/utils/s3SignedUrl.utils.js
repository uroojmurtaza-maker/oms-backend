const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function getSignedUrlForUpload({ key, contentType, expiresIn = 900 }) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// Renamed this one ↓↓↓
async function getTemporarySignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = {
  getSignedUrlForUpload,
  getTemporarySignedUrl,     // ← use this name everywhere
};