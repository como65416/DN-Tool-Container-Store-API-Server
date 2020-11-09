const bcrypt = require('bcrypt');
const { Account } = require('../models');

/**
 * @param  {Object} query knex object or knex transaction
 * @param  {String} username
 * @param  {String} password
 */
async function checkAccountPassword(username, password) {
  const account = await Account.findOne({
    where: {
      username,
    },
  });

  return account != null && bcrypt.compareSync(password, account.password);
}

/**
 * @param  {Object} knex object or knex transaction
 * @param  {String} username
 * @param  {Object} data
 */
async function updateAccountData(username, data) {
  const account = await Account.findOne({
    where: {
      username,
    },
  });

  if (data.password != null) {
    account.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync(10));
  }

  account.name = data.name || account.name;
  await account.save();
}

module.exports = {
  checkAccountPassword,
  updateAccountData,
};
