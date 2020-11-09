const sequelize = require('../libs/sequelize');
const account = require('./account');
const packageModel = require('./package');
const storeOption = require('./store-option');

module.exports = {
  Account: account(sequelize),
  Package: packageModel(sequelize),
  StoreOption: storeOption(sequelize),
};
