const express = require('express');
const { controller } = require('../resources/users');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();


router.post('/create-employee', protect, adminOnly, controller.createEmployee);
router.get('/get-employees', protect, adminOnly, controller.getEmployee);
router.delete('/delete-employee/:id', protect, adminOnly, controller.deleteEmployee);
router.post('/upload-url', controller.getProfileUploadUrl);

module.exports = router;