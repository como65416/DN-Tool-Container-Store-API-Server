const database = require('../services/database.js');
const dateFormat = require('dateformat');
const fs = require('fs');
const uniqid = require('uniqid');
const crypt = require('../libs/crypt.js');
const packageZipService = require('../services/packageZip.js');
const environment = require('../services/environment.js')

async function listPackages(req, res) {
  let dbQuery = database.getQuery();
  let baseUrl = req.protocol + "://" + req.headers.host;
  let username = res.locals.username;
  let packages = await dbQuery.table('package')
    .where('publish_username', '=', username);

  let myPackages = packages.map(p => {
    let encryptedPackageId = crypt.encrypt(p.id.toString())
    return {
      packageId: encryptedPackageId,
      packageName: p.name,
      version: p.version,
      iconUrl: baseUrl + "/package/" + encryptedPackageId + "/icon",
      description: p.description,
      status: p.status,
    }
  })

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(myPackages);
}

async function listStorePackage(req, res) {
  let dbQuery = database.getQuery();
  let baseUrl = req.protocol + "://" + req.headers.host;

  let packages = await dbQuery.table('package')
    .where('status', '=', 'published');
  let storePackages = packages.map(p => {
    let encryptedPackageId = crypt.encrypt(p.id.toString())
    return {
      packageId: encryptedPackageId,
      version: p.version,
      packageName: p.name,
      iconUrl: baseUrl + "/package/" + encryptedPackageId + "/icon",
      description: p.description,
      downloadUrl: baseUrl + "/package/" + encryptedPackageId + "/download",
    }
  })

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(storePackages);
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
  let iconDirPath = environment.getIconFolderPath();
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
  let packageDirPath = environment.getPackageFolderPath();
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
  let packageId = crypt.decrypt(req.params.id) || 0 ;
  let username = res.locals.username;
  let packageName = req.body.name;
  let description = req.body.description;
  let packageFile = (req.files != null) ? req.files.packageFile : null;
  let dbQuery = database.getQuery();
  let package = await dbQuery.table('package').where('id', '=', packageId).first();

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

    // extract icon file from package zip
    let iconDirPath = environment.getIconFolderPath();
    if (package.icon_filename != null && package.icon_filename != '' && fs.existsSync(iconDirPath + package.icon_filename)) {
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
  let packageId = crypt.decrypt(req.params.id) || 0;
  let username = res.locals.username;
  let dbQuery = database.getQuery();
  let package = await dbQuery.table('package').where('id', '=', packageId).first();

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
  await dbQuery.table('package').where('id', '=', packageId).delete();

  res.status(204).send('')
}

module.exports = {
  addNewPackage,
  updatePackage,
  deletePackage,
  listPackages,
  listStorePackage,
}
