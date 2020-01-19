
function getStoragePath() {
  return __dirname + "/../../storage/";
}

function getPackageFolderPath() {
  return __dirname + "/../../storage/package/";
}

function getIconFolderPath() {
  return __dirname + "/../../storage/icon/";
}

function getTempFolderPath() {
  return __dirname + "/../../storage/tmp/";
}

function getDefaultIconPath() {
  return __dirname + "/../../static_files/default-package-icon.png";
}

module.exports = {
  getStoragePath,
  getPackageFolderPath,
  getIconFolderPath,
  getTempFolderPath,
  getDefaultIconPath,
}