const database = require('../services/database.js');
const environment = require('../services/environment.js');
const fs = require('fs');
const path = require('path');

/**
 * @return {Object} store infomation
 */
async function getStoreInfo() {
  let query = database.getQuery();
  let storeOption = await query.table('store_option')
    .where('option_name', '=', 'store_name')
    .first();

  return {
    'name': storeOption.option_name
  }
}

/**
 * get icon realpath
 * @return {String|null}
 */
async function getStoreIconPath() {
  let query = database.getQuery();
  let storeOption = await query.table('store_option')
    .where('option_name', '=', 'icon_filename')
    .first();

  let iconPath = environment.getDefaultStoreIconPath();
  if (storeOption != null && storeOption.option_value != '') {
    iconPath = environment.getStoreFolderPath() + storeOption.option_value;
  }

  return path.resolve(iconPath);
}

/**
 * @param  {Object} info
 * @param  {String} iconFilePath
 */
async function updateStoreInfo(info, iconFilePath) {
  let query = database.getQuery();

  if (info.name != null) {
    await query.table('store_option')
      .where('option_name', '=', 'store_name')
      .update({'option_value': info.name});
  }

  if (iconFilePath != null) {
    let storeOption = await query.table('store_option')
      .where('option_name', '=', 'icon_filename');
    let originIconPath = storeOption.option_value;
    let iconSavePath = originIconPath || 'store-icon.jpg';
    fs.copyFileSync(iconFilePath, environment.getStoreFolderPath() + iconSavePath);

    await query.table('store_option')
      .where('option_name', '=', 'icon_filename')
      .update({'option_value': iconSavePath});
  }
}

module.exports = {
  getStoreInfo,
  getStoreIconPath,
  updateStoreInfo,
}
