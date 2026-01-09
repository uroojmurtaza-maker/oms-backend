'use strict';

const bcrypt = require('bcryptjs');
const {
  DESIGNATION,
  DEPARTMENT,
  EMPLOYEE_STATUS,
  USER_ROLE,
} = require('../constants');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('123456', 10);

    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: hashedPassword,
        designation: DESIGNATION.MANAGER,
        department: DEPARTMENT.ENGINEERING,
        dateOfBirth: '1990-01-01',
        profilePictureKey: null,
        employeeId: 'ADMIN-001',
        salary: 120000.0,
        joiningDate: '2024-01-01',
        phoneNumber: '9876543210',
        status: EMPLOYEE_STATUS.CURRENT_EMPLOYEE,
        role: USER_ROLE.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'admin@gmail.com',
    });
  },
};
