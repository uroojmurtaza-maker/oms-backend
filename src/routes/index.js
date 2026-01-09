// src/routes/index.js

const express = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');

const router = express.Router();

// Mount the routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
// router.use('/users', usersRoutes);

// You can easily add more resources later
// router.use('/departments', departmentRoutes);
// router.use('/leaves', leaveRoutes);

module.exports = router;