const { Sequelize } = require('sequelize');
const config = require('../config');

const { host } = config.database;
const user = config.database.username;
const { password } = config.database;
const database = config.database.name;

const sequelize = new Sequelize(database, user, password, {
  host,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
