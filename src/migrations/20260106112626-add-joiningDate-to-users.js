'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'joiningDate', {
      type: Sequelize.DATEONLY,     // Stores YYYY-MM-DD (perfect for joining date)
      allowNull: false,             // You can change to true if you want it optional
      defaultValue: Sequelize.fn('NOW'),  // Sets current date for new users
      // Or use a fixed date like '2024-01-01' if preferred
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'joiningDate');
  },
};