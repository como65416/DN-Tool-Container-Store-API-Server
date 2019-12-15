const encoder = require('../libs/encoder.js');
const database = require('../services/database.js');
const storeService = require('../services/store.js');
const path = require('path');

async function getIcon(req, res) {
  let iconPath = await storeService.getStoreIconPath();

  res.status(200).sendFile(path.resolve(iconPath));
}

async function listStorePackage(req, res) {
  let dbQuery = database.getQuery();
  let baseUrl = req.protocol + "://" + req.headers.host;

  let storeOption = await dbQuery.table('store_option')
    .where('option_name', '=', 'store_name')
    .first();
  let packages = await dbQuery.table('package')
    .where('status', '=', 'published');

  let storePackages = packages.map(p => {
    let encodedPackageId = encoder.encode(p.id.toString())
    return {
      packageId: encodedPackageId,
      version: p.version,
      packageName: p.name,
      iconUrl: baseUrl + "/packages/" + encodedPackageId + "/icon",
      description: p.description,
      downloadUrl: baseUrl + "/packages/" + encodedPackageId + "/download",
    }
  })

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({
    storeName: storeOption.option_value,
    storeIcon: baseUrl + '/store/icon',
    packages: storePackages,
  });
}

module.exports = {
  getIcon,
  listStorePackage,
}