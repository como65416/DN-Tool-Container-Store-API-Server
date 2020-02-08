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

/**
 * @param {Object} query knex object or knex transaction
 * @param {Object} packageData
 */
async function addNewPackage(query, packageData) {
  let packageId = (await query.table('package')
    .insert(packageData))[0];

  return packageId;
}

/**
 * @param {Object} query knex object or knex transaction
 * @param {Object} packageId
 * @param {Object} packageData
 */
async function updatePackageData(query, packageId, packageData) {
  await query.table('package')
    .where('id', '=', packageId)
    .update(packageData);
}

module.exports = {
  getStoreIconPath,
  addNewPackage,
  updatePackageData,
}