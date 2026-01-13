const express = require('express');
const { controller } = require('../resources/users');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

const router = express.Router();


router.post('/create-employee', protect, adminOnly, controller.createEmployee);
router.get('/get-employees', protect, controller.getEmployee);
router.get('/get-employee/:id', protect, adminOnly, controller.getEmployeeById);
router.delete('/delete-employee/:id', protect, adminOnly, controller.deleteEmployee);
router.put('/update-employee/:id', protect, adminOnly, controller.updateEmployee);
router.post('/upload-url', controller.getProfileUploadUrl);

module.exports = router;