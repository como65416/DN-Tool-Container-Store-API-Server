const { Sequelize } = require('sequelize');
const config = require('../config');

let host = config.database.host;
let user = config.database.username;
let password = config.database.password;
let database = config.database.name;

const sequelize = new Sequelize(database, user, password, {
  host: host,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
