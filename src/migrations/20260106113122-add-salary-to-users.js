'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'salary', {
      type: Sequelize.DECIMAL(12, 2),  // Up to 999,999,999.99 (12 digits total, 2 after decimal)
      allowNull: true,                 // Can be null (as per your model)
      defaultValue: null,              // Optional: explicitly set default to null
      comment: 'Employee salary (with 2 decimal places)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'salary');
  },
};