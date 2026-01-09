'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename the column from profilePictureUrl to profilePictureKey
    await queryInterface.renameColumn('users', 'profilePictureUrl', 'profilePictureKey');
  },

  async down(queryInterface, Sequelize) {
    // Reverse: rename back if needed
    await queryInterface.renameColumn('users', 'profilePictureKey', 'profilePictureUrl');
  }
};
