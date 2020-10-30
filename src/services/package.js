const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const environment = require('../services/environment.js')

/**
 * @param  {String} packagePath  package zip path
 * @return {Object}              package manifest config
 */
async function readZipManifestConfig(packagePath) {
  let zip = new AdmZip(packagePath);

  return JSON.parse(zip.readAsText("dn-manifest.json"));
}

/**
 * @param  {String} packagePath  package zip path
 * @param  {String} iconSavePath extract icon save path
 * @return {Object|null}         image information (if no icon in packages return null)
 */
async function extractZipIcon(packagePath, iconSavePath) {
  let tmpDirPath = environment.getTempFolderPath();
  let manifestConfig = await readZipManifestConfig(packagePath);
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

/**
 * @param  {String} packagePath package zip path
 * @param  {Object} updateData  update manifest config data
 */
async function updateZipManifestConfig(packagePath, updateData) {
  let mainfestConfig = await readZipManifestConfig(packagePath);
  Object.assign(mainfestConfig, updateData);
  let zip = new AdmZip(packagePath);
  let newContent = JSON.stringify(mainfestConfig, null, 2);
  zip.deleteFile("dn-manifest.json");
  zip.addFile("dn-manifest.json", Buffer.alloc(newContent.length, newContent));
  zip.writeZip();
}

module.exports = {
  readZipManifestConfig,
  extractZipIcon,
  updateZipManifestConfig
}
