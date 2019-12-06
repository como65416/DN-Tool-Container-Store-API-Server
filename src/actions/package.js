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
  let mainfestConfig = await packageZipService.readPackageManifestConfig(packageFile.tempFilePath);
  mainfestConfig.packageId = crypt.encrypt(packageId.toString());
  mainfestConfig.description = description;
  mainfestConfig.packageName = packageName;
  await packageZipService.updatePackageManifestConfig(packageFile.tempFilePath, mainfestConfig);

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
    // extract icon file from package zip
    let iconDirPath = __dirname + "/../../storage/icon/";
    if (package.icon_filename != null && package.icon_filename != '') {
      fs.unlinkSync(iconDirPath + package.icon_filename);
    }
    let iconSaveFilename = packageId + '-' + uniqid() + '.jpg';
    let iconInfo = await packageZipService.extractPackageIcon(packageFile.tempFilePath, iconDirPath + "/" + iconSaveFilename);
    Object.assign(databaseUpdateDatas, {'icon_filename': (iconInfo != null) ? iconSaveFilename : ''});
    Object.assign(databaseUpdateDatas, {'version': 'v' + dateFormat('yyyymmdd.HHMMss')})

    // update manifest information (new zip)
    let mainfestConfig = await packageZipService.readPackageManifestConfig(packageFile.tempFilePath);
    Object.assign(mainfestConfig, manifestUpdateDatas);
    await packageZipService.updatePackageManifestConfig(packageFile.tempFilePath, mainfestConfig);
    packageFile.mv(packageDirPath + package.package_filename);
  } else {
    // update manifest information (old zip)
    let mainfestConfig = await packageZipService.readPackageManifestConfig(packageDirPath + package.package_filename);
    Object.assign(mainfestConfig, manifestUpdateDatas);
    await packageZipService.updatePackageManifestConfig(packageDirPath + package.package_filename, mainfestConfig);
  }

  // update information in database
  if (Object.keys(databaseUpdateDatas).length > 0) {
    await dbQuery.table('package')
      .where('id', '=', packageId)
      .update(databaseUpdateDatas);
  }

  res.status(204).send('')
}

module.exports = {
  addNewPackage,
  updatePackage
}
