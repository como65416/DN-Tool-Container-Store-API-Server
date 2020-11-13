const bcrypt = require('bcrypt');
const { Account: AccountModel } = require('../models');

class Account {
  /**
   * @param  {Object} query knex object or knex transaction
   * @param  {String} username
   * @param  {String} password
   */
  async checkAccountPassword(username, password) {
    const account = await AccountModel.findOne({
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
  async updateAccountData(username, data) {
    const account = await AccountModel.findOne({
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
}

module.exports = Account;
