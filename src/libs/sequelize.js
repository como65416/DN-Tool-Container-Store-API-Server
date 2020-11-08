const { Sequelize } = require('sequelize');
const config = require('../config');

const host = config.database.host;
const user = config.database.username;
const password = config.database.password;
const database = config.database.name;

const sequelize = new Sequelize(database, user, password, {
  host: host,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
