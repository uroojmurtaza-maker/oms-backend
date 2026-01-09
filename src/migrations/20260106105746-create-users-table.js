// migrations/xxxx-create-users-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      designation: {
        type: Sequelize.ENUM('Manager', 'Developer', 'Designer', 'HR'),
        allowNull: false,
      },
      department: {
        type: Sequelize.ENUM('Engineering', 'Sales', 'Marketing', 'HR'),
        allowNull: false,
      },
      dateOfBirth: { type: Sequelize.DATEONLY, allowNull: true },
      profilePictureUrl: { type: Sequelize.STRING, allowNull: true },
      employeeId: { type: Sequelize.STRING, allowNull: false, unique: true },
      // salary: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      // joiningDate: { type: Sequelize.DATEONLY, allowNull: false },
      phoneNumber: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('Current Employee', 'Old Employee'),
        defaultValue: 'Current Employee',
      },
      role: {
        type: Sequelize.ENUM('Admin', 'Employee'),
        defaultValue: 'Employee',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};