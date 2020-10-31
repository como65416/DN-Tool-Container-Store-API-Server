const sequelize = require('../libs/sequelize');
const account = require('./account');
const package = require('./package');
const storeOption = require('./store-option');

module.exports = {
  Account: account(sequelize),
  Package: package(sequelize),
  StoreOption: storeOption(sequelize),
};
