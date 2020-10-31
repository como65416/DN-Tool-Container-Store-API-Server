const StoreOption = require('../models').StoreOption;
const environment = require('../services/environment.js');
const fs = require('fs');
const path = require('path');

/**
 * @return {Object} store infomation
 */
async function getStoreInfo() {
  let storeOption = await StoreOption.findOne({
    where: {
      'option_name': 'store_name',
    }
  });

  return {
    'name': storeOption.option_value
  }
}

/**
 * get icon realpath
 * @return {String|null}
 */
async function getStoreIconPath() {
  let storeOption = await StoreOption.findOne({
    where: {
      'option_name': 'icon_filename',
    }
  });

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
  if (info.name != null) {
    let storeOption = await StoreOption.findOne({
      where: {
        'option_name': 'store_name',
      }
    });
    storeOption.option_value = info.name;
    await storeOption.save();
  }

  if (iconFilePath != null) {
    let storeOption = await StoreOption.findOne({
      where: {
        'option_name': 'icon_filename',
      }
    });
    let originIconPath = storeOption.option_value;
    let iconSavePath = originIconPath || 'store-icon.jpg';
    fs.copyFileSync(iconFilePath, environment.getStoreFolderPath() + iconSavePath);

    storeOption.option_value = iconSavePath;
    await storeOption.save();
  }
}

module.exports = {
  getStoreInfo,
  getStoreIconPath,
  updateStoreInfo,
}
