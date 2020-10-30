const database = require('../services/database.js');

/**
 * @param  {Object} query knex object or knex transaction
 */
async function getStoreIconPath(query) {
  let accountData = await query.table('store_option')
    .where('option_name', '=', 'icon_filename')
    .first();

  let path = __dirname + "/../../static_files/default-store-icon.png";
  if (accountData != null && accountData.option_value != '') {
    path = __dirname + "/../../storage/" + accountData.option_value;
  }

  return path;
}

module.exports = {
  getStoreIconPath,
}
