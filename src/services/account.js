const database = require('../services/database.js');
const bcrypt = require('bcrypt');

async function checkAccountPassword(username, password) {
  let dbQuery = database.getQuery();
  let accountData = await dbQuery.table('account')
    .where('username', '=', username)
    .first();

  return bcrypt.compareSync(password, accountData.password);s
}

/**
 * @param  {String} username
 * @param  {Object} data
 */
async function updateAccountData(username, data) {
  let dbQuery = database.getQuery();
  await dbQuery.table('account')
    .where('username', '=', username)
    .update(data);
}

module.exports = {
  checkAccountPassword,
  updateAccountData,
}