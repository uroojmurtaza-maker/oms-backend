const { Sequelize, DataTypes } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/db.config.js')[env];


const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Initialize models
const userModel = require('./users.js');
db.User = userModel(sequelize, DataTypes);

module.exports = db;