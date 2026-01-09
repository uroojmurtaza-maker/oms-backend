// // src/middlewares/upload.middleware.js
// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const s3Client = require('../config/s3.config');

// const uploadProfileImage = multer({
//   storage: multerS3({
//     s3: s3Client, // AWS SDK v3 S3Client
//     bucket: process.env.AWS_S3_BUCKET,
//     acl: 'private',
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       // Unique filename: profiles/timestamp-originalname.jpg
//       const fileName = `profiles/${Date.now().toString()}-${file.originalname}`;
//       cb(null, fileName);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
//   fileFilter: (req, file, cb) => {
//     // Only allow images
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   },
// });

// // Export for single file upload (field name: 'profileImage')
// module.exports = uploadProfileImage;


// src/middlewares/upload.middleware.js
const multer = require('multer');

const uploadProfileImage = multer({
  storage: multer.memoryStorage(), // 👈 IMPORTANT
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

module.exports = uploadProfileImage;
