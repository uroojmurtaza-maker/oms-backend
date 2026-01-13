
const express = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');

const router = express.Router();

// Mount the routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);


module.exports = router;