const bcrypt = require('bcrypt');

/**
 * @param  {Object} query knex object or knex transaction
 * @param  {String} username
 * @param  {String} password
 */
async function checkAccountPassword(query, username, password) {
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
async function updateAccountData(query, username, data) {
  await query.table('account')
    .where('username', '=', username)
    .update(data);
}

module.exports = {
  checkAccountPassword,
  updateAccountData,
}
