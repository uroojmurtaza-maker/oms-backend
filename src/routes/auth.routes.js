const express = require('express');
const { controller } = require('../resources/auth');
const { protect } = require('../middlewares/auth.middleware');
const router = express.Router();

// Login - Public route
router.post('/login', controller.login);

// Logout - Just for clean frontend flow (no server action needed)
router.post('/logout', controller.logout);

router.put('/update-password', protect, controller.updatePassword);



module.exports = router;