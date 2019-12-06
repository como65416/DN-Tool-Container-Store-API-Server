const database = require('../libs/database.js');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const uniqid = require('uniqid');
const crypt = require('../libs/crypt.js');

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} name              package name
 * @apiParam  {String} description       package description]
 * @apiParam  {File}   packageFile       package file zip
 */
async function addNewPackage(req, res)
{
  let username = res.locals.username;
  let packageName = req.body.name;
  let description = req.body.description;
  let packageFile = req.files.packageFile;

  let dbQuery = database.getQuery();
  let packageId = (await dbQuery.table('package')
    .insert({
      name: packageName,
      version: '1.0.0',
      publish_username: username,
      description: description,
      status: 'published',
    }))[0];

  let tmpDirPath = __dirname + "/../../storage/tmp/";
  let iconDirPath = __dirname + "/../../storage/icon/";
  let packageDirPath = __dirname + "/../../storage/package/";
  let zip = new AdmZip(packageFile.tempFilePath);
  let mainfestConfig = JSON.parse(zip.readAsText("dn-manifest.json"));

  // extract icon from package zip
  let iconFilePath = mainfestConfig.iconFile;
  let iconSaveFilename = '';
  if (iconFilePath != null && iconFilePath != '') {
    let iconFileName = path.basename(iconFilePath);
    iconSaveFilename = packageId + '-' + uniqid() + '-' + iconFileName;
    zip.extractEntryTo(iconFilePath, tmpDirPath, false, true);
    fs.renameSync(
      tmpDirPath + "/" + iconFileName,
      iconDirPath + "/" + iconSaveFilename
    );
  }

  // update zip manifest.json config
  let savePackageName = packageId + '-' + uniqid() + ".zip";
  mainfestConfig.packageId = crypt.encrypt(packageId.toString());
  mainfestConfig.description = description;
  mainfestConfig.packageName = packageName;
  let newContent = JSON.stringify(mainfestConfig, null, 2)
  zip.deleteFile("dn-manifest.json");
  zip.addFile("dn-manifest.json", Buffer.alloc(newContent.length, newContent));
  zip.writeZip(packageDirPath + savePackageName);

  // update file information and remove temp file
  await dbQuery.table('package')
    .where('id', '=', packageId)
    .update({
      icon_filename: iconSaveFilename,
      package_filename: savePackageName
    });
  fs.unlinkSync(packageFile.tempFilePath);

  res.status(201).send({
    packageId: packageId
  })
}

module.exports = {
  addNewPackage
}
