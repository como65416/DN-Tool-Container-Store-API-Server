const database = require('../services/database.js');

/**
 * @param  {String} packagePath package zip path
 * @param  {Object} updateData  update manifest config data
 */
async function getStoreIconPath() {
  let dbQuery = database.getQuery();
  let accountData = await dbQuery.table('store_option')
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