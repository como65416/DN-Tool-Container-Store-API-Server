const { Sequelize } = require('sequelize');

let host = process.env.DATABASE_HOST;
let user = process.env.DATABASE_USERNAME;
let password = process.env.DATABASE_PASSWORD;
let database = process.env.DATABASE_NAME;

const sequelize = new Sequelize(database, user, password, {
  host: host,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
