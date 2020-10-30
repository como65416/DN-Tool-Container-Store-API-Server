const bcrypt = require('bcrypt');
const database = require('../services/database.js');

/**
 * @param  {Object} query knex object or knex transaction
 * @param  {String} username
 * @param  {String} password
 */
async function checkAccountPassword(username, password) {
  let query = database.getQuery();
  let accountData = await query.table('account')
    .where('username', '=', username)
    .first();

  return bcrypt.compareSync(password, accountData.password);
}

/**
 * @param  {Object} knex object or knex transaction
 * @param  {String} username
 * @param  {Object} data
 */
async function updateAccountData(username, data) {
  if (data.password != null) {
    data.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync(10));
  }

  let query = database.getQuery();
  await query.table('account')
    .where('username', '=', username)
    .update(data);
}

module.exports = {
  checkAccountPassword,
  updateAccountData,
}
