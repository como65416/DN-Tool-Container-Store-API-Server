const database = require('../libs/database.js');
const dateFormat = require('dateformat');
const fs = require('fs');
const uniqid = require('uniqid');
const crypt = require('../libs/crypt.js');
const packageZipService = require('../services/packageZip.js');

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

  let dbQuery = database.getQuery();
  let packageId = (await dbQuery.table('package')
    .insert({
      name: packageName,
      version: 'v' + dateFormat('yyyymmdd.HHMMss'),
      publish_username: username,
      description: description,
      status: 'published',
    }))[0];

  // extract icon from package zip
  let iconDirPath = __dirname + "/../../storage/icon/";
  let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
  let iconInfo = await packageZipService.extractPackageIcon(packageFile.tempFilePath, iconDirPath + "/" + iconSaveFilename)
  if (iconInfo == null) {
    iconSaveFilename = '';
  }

  // update zip manifest.json config
  await packageZipService.updatePackageManifestConfig(packageFile.tempFilePath, {
    'packageId': crypt.encrypt(packageId.toString()),
    description,
    packageName
  });

  // move zip to package dir
  let packageDirPath = __dirname + "/../../storage/package/";
  let savePackageName = packageId + '-' + uniqid() + ".zip";
  packageFile.mv(packageDirPath + savePackageName);

  // update file information in database
  await dbQuery.table('package')
    .where('id', '=', packageId)
    .update({
      icon_filename: iconSaveFilename,
      package_filename: savePackageName
    });

  res.status(201).send({
    packageId: packageId
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
  let packageId = req.params.id;
  let username = res.locals.username;
  let packageName = req.body.name;
  let description = req.body.description;
  let packageFile = (req.files != null) ? req.files.packageFile : null;
  let dbQuery = database.getQuery();
  let package = await dbQuery.table('package').where('id', '=', packageId).first();

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
  }

  let databaseUpdateDatas = {};
  let manifestUpdateDatas = {};
  Object.assign(databaseUpdateDatas, (description != null) ? {description} : {});
  Object.assign(databaseUpdateDatas, (packageName != null) ? {'name': packageName} : {});
  Object.assign(manifestUpdateDatas, (description != null) ? {description} : {});
  Object.assign(manifestUpdateDatas, (packageName != null) ? {'packageName': packageName} : {});

  let packageDirPath = __dirname + "/../../storage/package/";
  if (packageFile != null) {
    // update version
    let version = 'v' + dateFormat('yyyymmdd.HHMMss');
    Object.assign(databaseUpdateDatas, {'version': version});
    Object.assign(manifestUpdateDatas, {'version': version});

    // extract icon file from package zip
    let iconDirPath = __dirname + "/../../storage/icon/";
    if (package.icon_filename != null && package.icon_filename != '') {
      fs.unlinkSync(iconDirPath + package.icon_filename);
    }
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await packageZipService.extractPackageIcon(packageFile.tempFilePath, iconDirPath + "/" + iconSaveFilename);
    Object.assign(databaseUpdateDatas, {'icon_filename': (iconInfo != null) ? iconSaveFilename : ''});

    // update manifest information (new zip)
    await packageZipService.updatePackageManifestConfig(packageFile.tempFilePath, manifestUpdateDatas);
    packageFile.mv(packageDirPath + package.package_filename);
  } else {
    // update manifest information (old zip)
    await packageZipService.updatePackageManifestConfig(packageDirPath + package.package_filename, manifestUpdateDatas);
  }

  // update information in database
  if (Object.keys(databaseUpdateDatas).length > 0) {
    await dbQuery.table('package')
      .where('id', '=', packageId)
      .update(databaseUpdateDatas);
  }

  res.status(204).send('')
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} id            package id
 */
async function deletePackage(req, res) {
  let packageId = req.params.id;
  let username = res.locals.username;
  let dbQuery = database.getQuery();
  let package = await dbQuery.table('package').where('id', '=', packageId).first();

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
  }

  // delete icon
  let iconDirPath = __dirname + "/../../storage/icon/";
  if (package.icon_filename != null && package.icon_filename != '') {
    fs.unlinkSync(iconDirPath + package.icon_filename);
  }

  // delete icon
  let packageDirPath = __dirname + "/../../storage/package/";
  if (package.package_filename != null && package.package_filename != '') {
    fs.unlinkSync(packageDirPath + package.package_filename);
  }

  // delete from database
  await dbQuery.table('package').where('id', '=', packageId).delete();

  res.status(204).send('')
}

module.exports = {
  addNewPackage,
  updatePackage,
  deletePackage,
}
