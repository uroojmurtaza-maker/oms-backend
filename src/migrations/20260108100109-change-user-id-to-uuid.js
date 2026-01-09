'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension for PostgreSQL
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // First, add a new temporary UUID column (nullable first, then we'll populate it)
    await queryInterface.addColumn('users', 'id_new', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Generate UUIDs for existing rows (if any)
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET id_new = uuid_generate_v4()
      WHERE id_new IS NULL
    `);

    // Make the column NOT NULL after populating
    await queryInterface.changeColumn('users', 'id_new', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
      allowNull: false,
    });

    // Drop the old primary key constraint
    await queryInterface.removeConstraint('users', 'users_pkey');

    // Drop the old id column
    await queryInterface.removeColumn('users', 'id');

    // Rename the new column to id
    await queryInterface.renameColumn('users', 'id_new', 'id');

    // Add primary key constraint back
    await queryInterface.addConstraint('users', {
      fields: ['id'],
      type: 'primary key',
      name: 'users_pkey',
    });

    // Set default value for future inserts
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('uuid_generate_v4()'),
      primaryKey: true,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Add a new temporary INTEGER column
    await queryInterface.addColumn('users', 'id_new', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
    });

    // Drop the old primary key constraint
    await queryInterface.removeConstraint('users', 'users_pkey');

    // Drop the old UUID id column
    await queryInterface.removeColumn('users', 'id');

    // Rename the new column to id
    await queryInterface.renameColumn('users', 'id_new', 'id');

    // Add primary key constraint back
    await queryInterface.addConstraint('users', {
      fields: ['id'],
      type: 'primary key',
      name: 'users_pkey',
    });

    // Set auto-increment
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    });
  },
};

