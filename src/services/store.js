const fs = require('fs');
const path = require('path');
const { StoreOption } = require('../models');
const environment = require('../libs/environment');

/**
 * @return {Object} store infomation
 */
async function getStoreInfo() {
  const storeOption = await StoreOption.findOne({
    where: {
      option_name: 'store_name',
    },
  });

  return {
    name: storeOption.option_value,
  };
}

/**
 * get icon realpath
 * @return {String|null}
 */
async function getStoreIconPath() {
  const storeOption = await StoreOption.findOne({
    where: {
      option_name: 'icon_filename',
    },
  });

  let iconPath = environment.getDefaultStoreIconPath();
  if (storeOption != null && storeOption.option_value !== '') {
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
    const storeOption = await StoreOption.findOne({
      where: {
        option_name: 'store_name',
      },
    });
    storeOption.option_value = info.name;
    await storeOption.save();
  }

  if (iconFilePath != null) {
    const storeOption = await StoreOption.findOne({
      where: {
        option_name: 'icon_filename',
      },
    });
    const originIconPath = storeOption.option_value;
    const iconSavePath = originIconPath || 'store-icon.jpg';
    fs.copyFileSync(iconFilePath, environment.getStoreFolderPath() + iconSavePath);

    storeOption.option_value = iconSavePath;
    await storeOption.save();
  }
}

module.exports = {
  getStoreInfo,
  getStoreIconPath,
  updateStoreInfo,
};
