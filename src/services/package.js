const AdmZip = require('adm-zip');
const database = require('../services/database.js');
const dateFormat = require('dateformat');
const encoder = require('../libs/encoder.js');
const environment = require('../services/environment.js');
const fs = require('fs');
const path = require('path');
const storeService = require('../services/store.js');
const uniqid = require('uniqid');

async function getAllPublishedPackages() {
  let query = database.getQuery();
  let packages = await query.table('package')
    .where('status', '=', 'published');

  return packages;
}

/**
 * @param  {Integer} packageId
 * @return {Object}
 */
async function getPackageInfo(packageId) {
  let query = database.getQuery();

  return await query.table('package')
    .where('id', '=', packageId)
    .first();
}

async function deletePackage(packageId) {
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

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

  // delete from database
  await query.table('package').where('id', '=', packageId).delete();
}

/**
 * @param  {String} username
 * @return {Array}
 */
async function getUserPackages(username) {
  let query = database.getQuery();
  let packages = await query.table('package')
    .where('publish_username', '=', username);

  return packages;
}

/**
 * @param  {String}    username
 * @param  {Object}    packageInfo
 * @param  {String}    filePath    package zip file path
 */
async function createPackage(username, packageInfo, filePath) {
  let query = database.getQuery();
  let trx = await query.transaction();

  try {
    let packageId = (await trx.table('package')
      .insert({
        name: packageInfo.name,
        description: packageInfo.description,
        version: dateFormat('yyyymmdd.HHMMss'),
        publish_username: username,
        status: 'published',
      }))[0];

    // extract icon from package zip
    let iconDirPath = environment.getIconFolderPath();
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await extractZipIcon(filePath, iconDirPath + "/" + iconSaveFilename)
    if (iconInfo == null) {
      iconSaveFilename = '';
    }

    // update zip manifest.json config
    await updateZipManifestConfig(filePath, {
      'packageId': encoder.encode(packageId.toString()),
      'description': packageInfo.description,
      'packageName': packageInfo.name
    });

    // copy zip to package dir
    let packageDirPath = environment.getPackageFolderPath();
    let savePackageName = packageId + '-' + uniqid() + ".zip";
    fs.copyFileSync(filePath, packageDirPath + savePackageName);

    // update file information in database
    await trx.table('package')
      .where('id', '=', packageId)
      .update({
        icon_filename: iconSaveFilename,
        package_filename: savePackageName
      });

    await trx.commit();

    return packageId;
  } catch (e) {
    await trx.rollback();
    throw e;
  }
}

/**
 * @param  {Integer} packageId
 * @param  {Object}  packageInfo
 * @param  {String}  filePath    package zip path
 */
async function updatePackage(packageId, packageInfo, filePath) {
  let query = database.getQuery();
  let package = await query.table('package')
    .where('id', '=', packageId)
    .first();

  let databaseUpdateDatas = {};
  let manifestUpdateDatas = {};
  Object.assign(databaseUpdateDatas, (packageInfo.description != null) ? {'description': packageInfo.description} : {});
  Object.assign(databaseUpdateDatas, (packageInfo.name != null) ? {'name': packageInfo.name} : {});
  Object.assign(manifestUpdateDatas, (packageInfo.description != null) ? {'description': packageInfo.description} : {});
  Object.assign(manifestUpdateDatas, (packageInfo.name != null) ? {'packageName': packageInfo.name} : {});

  let packageDirPath = environment.getPackageFolderPath();
  if (filePath != null) {
    // update version
    let version = 'v' + dateFormat('yyyymmdd.HHMMss');
    Object.assign(databaseUpdateDatas, {'version': version});
    Object.assign(manifestUpdateDatas, {'version': version, 'packageId': encoder.encode(packageId)});

    // extract icon file from package zip
    let iconDirPath = environment.getIconFolderPath();
    if (package.icon_filename != null && package.icon_filename != '' && fs.existsSync(iconDirPath + package.icon_filename)) {
      fs.unlinkSync(iconDirPath + package.icon_filename);
    }
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await extractZipIcon(filePath, iconDirPath + "/" + iconSaveFilename);
    Object.assign(databaseUpdateDatas, {'icon_filename': (iconInfo != null) ? iconSaveFilename : ''});

    // update manifest information (new zip)
    await updateZipManifestConfig(filePath, manifestUpdateDatas);
    fs.copyFileSync(filePath, packageDirPath + package.package_filename);
  } else {
    // update manifest information (old zip)
    await updateZipManifestConfig(packageDirPath + package.package_filename, manifestUpdateDatas);
  }

  // update information in database
  if (Object.keys(databaseUpdateDatas).length > 0) {
    let query = database.getQuery();
    await query.table('package')
      .where('id', '=', packageId)
      .update(databaseUpdateDatas);
  }
}

/**
 * @param  {Integer}      packageId
 * @return {String|null}  icon path
 */
async function getPackageIconPath(packageId) {
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

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
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

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
