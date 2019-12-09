const database = require('../services/database.js');
const bcrypt = require('bcrypt');

async function checkAccountPassword(username, password) {
  let dbQuery = database.getQuery();
  let accountData = await dbQuery.table('account')
    .where('username', '=', username)
    .first();

  return bcrypt.compareSync(password, accountData.password);s
}

async function getAccountPermision(username) {
  let dbQuery = database.getQuery();
  let accountPermissions = await dbQuery.table('account_permission')
    .select('permission_id')
    .where('username', '=', username);
  let permissions = await dbQuery.table('permission')
    .select('name')
    .whereIn('id', accountPermissions.map(d => d.permission_id));

  return permissions.map(d => d.name);
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
  getAccountPermision,
  updateAccountData,
}