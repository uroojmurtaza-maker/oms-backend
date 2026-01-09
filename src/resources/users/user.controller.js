const userService = require('./user.service')
const uploadProfileImage = require('../../middlewares/upload.middleware');

const createEmployee = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body, req.file);

    res.status(201).json({
      message: 'Employee created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Create employee error:', error);

    // Handle Multer-specific errors
    if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large (max 5MB)' });
      }
      return res.status(400).json({ message: error.message });
    }

    // Handle validation errors
    let statusCode = 500;
    if (error.message.includes('exists') ||
      error.message.includes('Missing') ||
      error.message.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      message: error.message || 'Failed to create employee',
    });
  }
};

const getEmployee = async (req, res) => {
  try {
    const employees = await userService.getEmployees();
    res.status(200).json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to get employees' });
  }
};


module.exports = {
  createEmployee: [
    uploadProfileImage.single('profileImage'),
    createEmployee,
  ],
  getEmployee,
};