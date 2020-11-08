const bcrypt = require('bcrypt');
const Account = require('../models/account');
const Package = require('../models/package');
const StoreOption = require('../models/store-option');

async function install(sequelize) {
  await Account(sequelize).sync();
  await Package(sequelize).sync();
  await StoreOption(sequelize).sync();

  const salt = bcrypt.genSaltSync(10);
  await Account(sequelize).bulkCreate([
    {username: 'admin', password: bcrypt.hashSync('admin', salt), name: 'Admin'},
  ]);

  await StoreOption(sequelize).bulkCreate([
    {option_name: 'store_name', option_value: 'My Custom DN Tool Package Store'},
    {option_name: 'icon_filename', option_value: ''},
  ]);
}

module.exports = {
  install
}
