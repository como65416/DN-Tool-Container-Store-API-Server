
function getPackageFolderPath() {
  return __dirname + "/../../storage/package/";
}

function getIconFolderPath() {
  return __dirname + "/../../storage/icon/";
}

function getTempFolderPath() {
  return __dirname + "/../../storage/tmp/";
}

module.exports = {
  getPackageFolderPath,
  getIconFolderPath,
  getTempFolderPath,
}