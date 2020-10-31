
function getPackageFolderPath() {
  return __dirname + "/../../storage/package/";
}

function getIconFolderPath() {
  return __dirname + "/../../storage/icon/";
}

function getTempFolderPath() {
  return __dirname + "/../../storage/tmp/";
}

function getDefaultStoreIconPath() {
  return __dirname + "/../../static_files/default-store-icon.png";
}

function getDefaultIconPath() {
  return __dirname + "/../../static_files/default-package-icon.png";
}

function getStoreFolderPath() {
  return __dirname + "/../../storage/store/";
}

module.exports = {
  getPackageFolderPath,
  getIconFolderPath,
  getTempFolderPath,
  getStoreFolderPath,
  getDefaultIconPath,
  getDefaultStoreIconPath,
}
