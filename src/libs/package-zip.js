const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const environment = require('./environment');

/**
 * @param  {String} packagePath  package zip path
 * @return {Object}              package manifest config
 */
async function readZipManifestConfig(packagePath) {
  const zip = new AdmZip(packagePath);

  return JSON.parse(zip.readAsText('dn-manifest.json'));
}

/**
 * @param  {String} packagePath package zip path
 * @param  {Object} updateData  update manifest config data
 */
async function updateZipManifestConfig(packagePath, updateData) {
  const mainfestConfig = await readZipManifestConfig(packagePath);
  Object.assign(mainfestConfig, updateData);
  const zip = new AdmZip(packagePath);
  const newContent = JSON.stringify(mainfestConfig, null, 2);
  zip.deleteFile('dn-manifest.json');
  zip.addFile('dn-manifest.json', Buffer.alloc(newContent.length, newContent));
  zip.writeZip();
}

/**
 * @param  {String} packagePath  package zip path
 * @param  {String} iconSavePath extract icon save path
 * @return {Object|null}         image information (if no icon in packages return null)
 */
async function extractZipIcon(packagePath, iconSavePath) {
  const tmpDirPath = environment.getTempFolderPath();
  const manifestConfig = await readZipManifestConfig(packagePath);
  const iconFilePath = manifestConfig.iconFile;
  if (iconFilePath == null || iconFilePath === '') {
    return null;
  }

  const iconFileName = path.basename(iconFilePath);
  const zip = new AdmZip(packagePath);
  zip.extractEntryTo(iconFilePath, tmpDirPath, false, true);
  fs.renameSync(
    `${tmpDirPath}/${iconFileName}`,
    iconSavePath,
  );

  return {
    filePathInZip: iconFilePath,
  };
}

module.exports = {
  updateZipManifestConfig,
  extractZipIcon,
};
