const userService = require('./user.service')


const createEmployee = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);

    res.status(201).json({
      message: 'Employee created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Create employee error:', error);


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
    const { page, limit, search, department, designation, sortBy, sortOrder } = req.query;
    const currentUserId = req.user?.id; // Get user ID from token
    const result = await userService.getEmployees(page, limit, search, department, designation, sortBy, sortOrder, currentUserId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to get employees' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.getEmployeeById(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get employee by id error:', error);
    res.status(500).json({ message: 'Failed to get employee by id' });
  }
};


const getProfileUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType are required' });
    }

    const uploadData = await userService.getProfilePresignedUrl({
      fileName,
      fileType
    });

    res.status(200).json(uploadData);
  } catch (error) {
    console.error('Get presigned url error:', error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteEmployee(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Failed to delete employee' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.updateEmployee(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Failed to update employee' });
  }
};

const getProfile = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const result = await userService.getProfile(currentUserId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const result = await userService.updateProfile(currentUserId, req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = { getProfile, updateProfile, createEmployee, getProfileUploadUrl, getEmployee, getEmployeeById, deleteEmployee, updateEmployee };