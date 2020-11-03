const encoder = require('../../libs/encoder');
const fs = require('fs');
const packageService = require('../../services/package');
const store = require('../../services/store');

async function listPackages(req, res) {
  let baseUrl = req.protocol + "://" + req.headers.host;
  let username = res.locals.username;
  let packages = await packageService.getUserPackages(username);

  packages = packages.map(p => {
    let encodedPackageId = encoder.encodeId(p.id.toString());

    return {
      packageId: encodedPackageId,
      packageName: p.name,
      version: p.version,
      iconUrl: baseUrl + "/packages/" + encodedPackageId + "/icon",
      description: p.description,
      status: p.status,
    }
  })

  return res.status(200).json(packages).end();
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} name              package name
 * @apiParam  {String} description       package description]
 * @apiParam  {File}   packageFile       package file zip
 */
async function addNewPackage(req, res) {
  let username = res.locals.username;
  let name = req.body.name;
  let description = req.body.description;
  let packageFilePath = (req.files != null) ? req.files.packageFile.tempFilePath : null;

  let packageId = await packageService.createPackage(username, {name, description}, packageFilePath);

  if (packageFilePath != null) {
    fs.unlinkSync(packageFilePath);
  }

  res.status(201).send({
    packageId: encoder.encodeId(packageId)
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
  let packageId = encoder.decodeId(req.params.id);
  let name = req.body.name;
  let description = req.body.description;
  let packageFilePath = (req.files != null) ? req.files.packageFile.tempFilePath : null;

  await packageService.updatePackage(packageId, {name, description}, packageFilePath);

  if (packageFilePath != null) {
    fs.unlinkSync(packageFilePath);
  }

  res.status(204).send('')
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} id            package id
 */
async function deletePackage(req, res) {
  let packageId = encoder.decodeId(req.params.id);

  await packageService.deletePackage(packageId);

  res.status(204).send('')
}

async function getPackageIcon(req, res) {
  let packageId = encoder.decodeId(req.params.id);
  let iconFilePath = await packageService.getPackageIconPath(packageId);

  if (iconFilePath == null) {
    return res.status(404).send('Not found').end();
  }

  res.status(200).sendFile(iconFilePath);
}

async function downloadPackage(req, res) {
  let packageId = encoder.decodeId(req.params.id);
  let packageFilePath = await packageService.getPackageZipPath(packageId);

  if (packageFilePath == null) {
    return res.status(404).send('Not found').end();
  }

  res.status(200).sendFile(packageFilePath);
}

module.exports = {
  addNewPackage,
  updatePackage,
  deletePackage,
  listPackages,
  getPackageIcon,
  downloadPackage,
}
