const database = require('../services/database.js');
const dateFormat = require('dateformat');
const fs = require('fs');
const uniqid = require('uniqid');
const encoder = require('../libs/encoder.js');
const packageService = require('../services/package.js');
const path = require('path');
const environment = require('../services/environment.js')
const store = require('../services/store.js')

async function listPackages(req, res) {
  let query = database.getQuery();
  let baseUrl = req.protocol + "://" + req.headers.host;
  let username = res.locals.username;
  let packages = await query.table('package')
    .where('publish_username', '=', username);

  let myPackages = packages.map(p => {
    let encodedPackageId = encoder.encode(p.id.toString())
    return {
      packageId: encodedPackageId,
      packageName: p.name,
      version: p.version,
      iconUrl: baseUrl + "/packages/" + encodedPackageId + "/icon",
      description: p.description,
      status: p.status,
    }
  })

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(myPackages);
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} name              package name
 * @apiParam  {String} description       package description]
 * @apiParam  {File}   packageFile       package file zip
 */
async function addNewPackage(req, res) {
  let username = res.locals.username;
  let packageName = req.body.name;
  let description = req.body.description;
  let packageFile = (req.files != null) ? req.files.packageFile : null;

  let query = database.getQuery();
  let trx = await query.transaction();
  let packageId = null;
  try {
    packageId = await store.addNewPackage(trx, {
      name: packageName,
      version: dateFormat('yyyymmdd.HHMMss'),
      publish_username: username,
      description: description,
      status: 'published',
    });

    // extract icon from package zip
    let iconDirPath = environment.getIconFolderPath();
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await packageService.extractPackageIcon(packageFile.tempFilePath, iconDirPath + "/" + iconSaveFilename)
    if (iconInfo == null) {
      iconSaveFilename = '';
    }

    // update zip manifest.json config
    await packageService.updatePackageManifestConfig(packageFile.tempFilePath, {
      'packageId': encoder.encode(packageId.toString()),
      description,
      packageName
    });

    // move zip to package dir
    let packageDirPath = environment.getPackageFolderPath();
    let savePackageName = packageId + '-' + uniqid() + ".zip";
    packageFile.mv(packageDirPath + savePackageName);

    // update file information in database
    await store.updatePackageData(trx, packageId, {
      icon_filename: iconSaveFilename,
      package_filename: savePackageName
    });

    await trx.commit();
  } catch (e) {
    await trx.rollback();
    console.log(e);
    throw e;
  }

  res.status(201).send({
    packageId: encoder.encode(packageId)
  })
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} id            package id
 * @apiParam  {String} name          package name
 * @apiParam  {String} description   package description]
 * @apiParam  {File}   packageFile   package file zip
 */
async function updatePackage(req, res) {
  let packageId = encoder.decode(req.params.id) || 0 ;
  let username = res.locals.username;
  let packageName = req.body.name;
  let description = req.body.description;
  let packageFile = (req.files != null) ? req.files.packageFile : null;
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
    return;
  }

  let databaseUpdateDatas = {};
  let manifestUpdateDatas = {};
  Object.assign(databaseUpdateDatas, (description != null) ? {description} : {});
  Object.assign(databaseUpdateDatas, (packageName != null) ? {'name': packageName} : {});
  Object.assign(manifestUpdateDatas, (description != null) ? {description} : {});
  Object.assign(manifestUpdateDatas, (packageName != null) ? {'packageName': packageName} : {});

  let packageDirPath = environment.getPackageFolderPath();
  if (packageFile != null) {
    // update version
    let version = 'v' + dateFormat('yyyymmdd.HHMMss');
    Object.assign(databaseUpdateDatas, {'version': version});
    Object.assign(manifestUpdateDatas, {'version': version});
    Object.assign(manifestUpdateDatas, {'packageId': encoder.encode(packageId)});

    // extract icon file from package zip
    let iconDirPath = environment.getIconFolderPath();
    if (package.icon_filename != null && package.icon_filename != '' && fs.existsSync(iconDirPath + package.icon_filename)) {
      fs.unlinkSync(iconDirPath + package.icon_filename);
    }
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await packageService.extractPackageIcon(packageFile.tempFilePath, iconDirPath + "/" + iconSaveFilename);
    Object.assign(databaseUpdateDatas, {'icon_filename': (iconInfo != null) ? iconSaveFilename : ''});

    // update manifest information (new zip)
    await packageService.updatePackageManifestConfig(packageFile.tempFilePath, manifestUpdateDatas);
    packageFile.mv(packageDirPath + package.package_filename);
  } else {
    // update manifest information (old zip)
    await packageService.updatePackageManifestConfig(packageDirPath + package.package_filename, manifestUpdateDatas);
  }

  // update information in database
  if (Object.keys(databaseUpdateDatas).length > 0) {
    await store.updatePackageData(query, packageId, databaseUpdateDatas);
  }

  res.status(204).send('')
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} id            package id
 */
async function deletePackage(req, res) {
  let packageId = encoder.decode(req.params.id) || 0;
  let username = res.locals.username;
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
    return;
  }

  // delete icon
  let iconDirPath = environment.getIconFolderPath();
  if (package.icon_filename != null && package.icon_filename != '' && fs.existsSync(iconDirPath + package.icon_filename)) {
    fs.unlinkSync(iconDirPath + package.icon_filename);
  }

  // delete icon
  let packageDirPath = environment.getPackageFolderPath();
  if (package.package_filename != null && package.package_filename != '' && fs.existsSync(packageDirPath + package.package_filename)) {
    fs.unlinkSync(packageDirPath + package.package_filename);
  }

  // delete from database
  await query.table('package').where('id', '=', packageId).delete();

  res.status(204).send('')
}

async function getPackageIcon(req, res) {
  let packageId = encoder.decode(req.params.id) || 0 ;
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

  if (package == null) {
    res.status(404).send('Not found');
    return;
  }

  let iconDirPath = environment.getIconFolderPath();
  if (fs.existsSync(iconDirPath + package.icon_filename)) {
    res.status(200).sendFile(path.resolve(iconDirPath + package.icon_filename));
    return;
  }
  res.status(200).sendFile(path.resolve(environment.getDefaultIconPath()));
}

async function downloadPackage(req, res) {
  let packageId = encoder.decode(req.params.id) || 0 ;
  let query = database.getQuery();
  let package = await query.table('package').where('id', '=', packageId).first();

  let packageDirPath = environment.getPackageFolderPath();
  if (package == null && !fs.existsSync(packageDirPath + package.package_filename)) {
    res.status(404).send('Not found');
    return;
  }

  res.status(200).download(path.resolve(packageDirPath + package.package_filename), 'package.zip');
}

module.exports = {
  addNewPackage,
  updatePackage,
  deletePackage,
  listPackages,
  getPackageIcon,
  downloadPackage,
}
