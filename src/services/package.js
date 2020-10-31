const AdmZip = require('adm-zip');
const dateFormat = require('dateformat');
const encoder = require('../libs/encoder.js');
const environment = require('../services/environment.js');
const fs = require('fs');
const path = require('path');
const sequelize = require('../libs/sequelize');
const storeService = require('../services/store.js');
const uniqid = require('uniqid');
const Package = require('../models').Package;

async function getAllPublishedPackages() {
  let packages = await Package.findAll({
    where: {
      'status': 'published'
    }
  });

  return packages.map(p => p.dataValues);
}

/**
 * @param  {Integer} packageId
 * @return {Object}
 */
async function getPackageInfo(packageId) {
  let package = await Package.findByPk(packageId);

  return (package != null) ? package.dataValues : package;
}

async function deletePackage(packageId) {
  let package = await Package.findByPk(packageId);

  // delete icon
  let iconDirPath = environment.getIconFolderPath();
  if (package.icon_filename != null && package.icon_filename != '' && fs.existsSync(iconDirPath + package.icon_filename)) {
    fs.unlinkSync(iconDirPath + package.icon_filename);
  }

  // delete zip
  let packageDirPath = environment.getPackageFolderPath();
  if (package.package_filename != null && package.package_filename != '' && fs.existsSync(packageDirPath + package.package_filename)) {
    fs.unlinkSync(packageDirPath + package.package_filename);
  }

  // delete data
  await package.destroy();
}

/**
 * @param  {String} username
 * @return {Array}
 */
async function getUserPackages(username) {
  let packages = await Package.findAll({
    where: {
      'publish_username': username
    }
  });

  return packages.map(p => p.dataValues);
}

/**
 * @param  {String}    username
 * @param  {Object}    packageInfo
 * @param  {String}    filePath    package zip file path
 */
async function createPackage(username, packageInfo, filePath) {
  let transaction = await sequelize.transaction();

  try {
    let package = await Package.create({
      name: packageInfo.name,
      description: packageInfo.description,
      version: dateFormat('yyyymmdd.HHMMss'),
      publish_username: username,
      status: 'published',
    }, {transaction});

    // extract icon from package zip
    let iconDirPath = environment.getIconFolderPath();
    let iconSaveFilename = package.id + '-' + uniqid() + '.jpg';
    let iconInfo = await extractZipIcon(filePath, iconDirPath + "/" + iconSaveFilename)
    if (iconInfo == null) {
      iconSaveFilename = '';
    }
    package.icon_filename = iconSaveFilename;

    // update zip manifest.json config
    await updateZipManifestConfig(filePath, {
      'packageId': encoder.encode(package.id.toString()),
      'description': packageInfo.description,
      'packageName': packageInfo.name
    });

    // copy zip to package dir
    let packageDirPath = environment.getPackageFolderPath();
    let savePackageName = package.id + '-' + uniqid() + ".zip";
    fs.copyFileSync(filePath, packageDirPath + savePackageName);
    package.package_filename = savePackageName;

    // update file information
    await package.save({transaction});
    await transaction.commit();

    return package.id;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

/**
 * @param  {Integer} packageId
 * @param  {Object}  packageInfo
 * @param  {String}  filePath    package zip path
 */
async function updatePackage(packageId, packageInfo, filePath) {
  let package = await Package.findByPk(packageId);

  let manifestUpdateDatas = {};
  if (packageInfo.description != null) {
    package.description = manifestUpdateDatas.description = packageInfo.description;
  }

  if (packageInfo.name != null) {
    package.name = manifestUpdateDatas.packageName = packageInfo.name;
  }

  let packageDirPath = environment.getPackageFolderPath();
  if (filePath != null) {
    // update version
    let version = 'v' + dateFormat('yyyymmdd.HHMMss');
    package.version = manifestUpdateDatas.version = version;
    manifestUpdateDatas.packageId = encoder.encode(packageId);

    // extract icon file from package zip
    let iconDirPath = environment.getIconFolderPath();
    if (package.icon_filename != null && package.icon_filename != '' && fs.existsSync(iconDirPath + package.icon_filename)) {
      fs.unlinkSync(iconDirPath + package.icon_filename);
    }
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await extractZipIcon(filePath, iconDirPath + "/" + iconSaveFilename);
    package.icon_filename = (iconInfo != null) ? iconSaveFilename : '';

    // update manifest information (new zip)
    await updateZipManifestConfig(filePath, manifestUpdateDatas);
    fs.copyFileSync(filePath, packageDirPath + package.package_filename);
  } else {
    // update manifest information (old zip)
    await updateZipManifestConfig(packageDirPath + package.package_filename, manifestUpdateDatas);
  }

  // update package data
  await package.save();
}

/**
 * @param  {Integer}      packageId
 * @return {String|null}  icon path
 */
async function getPackageIconPath(packageId) {
  let package = await Package.findByPk(packageId);

  if (package == null) {
    return null;
  }

  let iconDirPath = environment.getIconFolderPath();
  if (fs.existsSync(iconDirPath + package.icon_filename)) {
    return path.resolve(iconDirPath + package.icon_filename);
  }

  return path.resolve(environment.getDefaultIconPath());
}

/**
 * @param  {Integer}      packageId
 * @return {String|null}  package file path
 */
async function getPackageZipPath(packageId) {
  let package = await Package.findByPk(packageId);

  let packageDirPath = environment.getPackageFolderPath();
  if (package != null && fs.existsSync(packageDirPath + package.package_filename)) {
    return path.resolve(packageDirPath + package.package_filename);
  }

  return null;
}

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
  getAllPublishedPackages,
  getPackageInfo,
  getUserPackages,
  getPackageIconPath,
  getPackageZipPath,
  createPackage,
  updatePackage,
  deletePackage,
}
