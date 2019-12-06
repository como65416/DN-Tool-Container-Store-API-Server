const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

/**
 * @param  {String} packagePath  package zip path
 * @return {Object}              package manifest config
 */
async function readPackageManifestConfig(packagePath) {
  let zip = new AdmZip(packagePath);
  return JSON.parse(zip.readAsText("dn-manifest.json"));
}

/**
 * @param  {String} packagePath  package zip path
 * @param  {String} iconSavePath extract icon save path
 * @return {Object|null}         image information (if no icon in packages return null)
 */
async function extractPackageIcon(packagePath, iconSavePath) {
  let tmpDirPath = __dirname + "/../../storage/tmp/";
  let manifestConfig = await readPackageManifestConfig(packagePath);
  let iconFilePath = manifestConfig.iconFile;
  if (iconFilePath == null || iconFilePath == '') {
    return null;
  }

  let iconFileName = path.basename(iconFilePath);
  let zip = new AdmZip(packagePath);
  zip.extractEntryTo(iconFilePath, tmpDirPath, false, true);
  fs.renameSync(
    tmpDirPath + "/" + iconFileName,
    iconSavePath
  );

  return {
    'filePathInZip': iconFilePath
  }
}

async function updatePackageManifestConfig(packagePath, config) {
  let zip = new AdmZip(packagePath);
  let newContent = JSON.stringify(config, null, 2)
  zip.deleteFile("dn-manifest.json");
  zip.addFile("dn-manifest.json", Buffer.alloc(newContent.length, newContent));
  zip.writeZip(packagePath);
}

module.exports = {
  readPackageManifestConfig,
  extractPackageIcon,
  updatePackageManifestConfig
}