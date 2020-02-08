const encoder = require('../libs/encoder.js');
const database = require('../services/database.js');
const storeService = require('../services/store.js');
const environment = require('../services/environment.js')
const path = require('path');

async function getIcon(req, res) {
  let query = database.getQuery();
  let iconPath = await storeService.getStoreIconPath(query);

  res.status(200).sendFile(path.resolve(iconPath));
}

async function updateStoreInfo(req, res) {
  let query = database.getQuery();
  let storeName = req.body.storeName;
  let storeIcon = (req.files != null) ? req.files.storeIcon : null;

  if (storeName != null) {
    await query.table('store_option')
      .where('option_name', '=', 'store_name')
      .update({'option_value': storeName});
  }
  if (storeIcon != null) {
    let storeOption = await query.table('store_option')
      .where('option_name', '=', 'icon_filename');
    let originIconPath = storeOption.option_value;
    let iconSavePath = originIconPath || 'store-icon.jpg';
    storeIcon.mv(environment.getStoragePath() + iconSavePath);

    await query.table('store_option')
      .where('option_name', '=', 'icon_filename')
      .update({'option_value': iconSavePath});
  }

  res.status(204).send('')
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
  });

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({
    storeName: storeOption.option_value,
    storeIcon: baseUrl + '/store/icon',
    packages: storePackages,
  });
}

module.exports = {
  getIcon,
  updateStoreInfo,
  listStorePackage,
}