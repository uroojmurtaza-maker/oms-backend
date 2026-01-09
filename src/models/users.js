const { DataTypes } = require('sequelize');
const {
  DESIGNATION_MODEL_VALUES,
  DEPARTMENT_MODEL_VALUES,
  EMPLOYEE_STATUS_VALUES,
  USER_ROLE_VALUES,
  DEFAULTS,
} = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      designation: {
        type: DataTypes.ENUM(...DESIGNATION_MODEL_VALUES),
        allowNull: false,
      },
      department: {
        type: DataTypes.ENUM(...DEPARTMENT_MODEL_VALUES),
        allowNull: false,
      },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
      profilePictureKey: { type: DataTypes.STRING, allowNull: true },
      employeeId: { type: DataTypes.STRING, allowNull: false, unique: true },
      salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      joiningDate: { type: DataTypes.DATEONLY, allowNull: false },
      phoneNumber: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM(...EMPLOYEE_STATUS_VALUES),
        defaultValue: DEFAULTS.STATUS,
      },
      role: {
        type: DataTypes.ENUM(...USER_ROLE_VALUES),
        defaultValue: DEFAULTS.ROLE,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
    }
  );

  return User;
};