const encoder = require('../../libs/encoder');
const storeService = require('../../services/store');
const packageService = require('../../services/package');

async function getIcon(req, res) {
  let iconPath = await storeService.getStoreIconPath();

  res.status(200).sendFile(iconPath);
}

async function updateStoreInfo(req, res) {
  let name = req.body.storeName;
  let storeIconPath = (req.files != null) ? req.files.storeIcon.tempFilePath : null;

  await storeService.updateStoreInfo({name}, storeIconPath);

  res.status(204).send('').end();
}

async function listStorePackage(req, res) {
  let baseUrl = req.protocol + "://" + req.headers.host;
  let storeInfo = await storeService.getStoreInfo();
  let packages = await packageService.getAllPublishedPackages();

  let storePackages = packages.map(p => {
    let encodedPackageId = encoder.encodeId(p.id.toString());

    return {
      packageId: encodedPackageId,
      version: p.version,
      packageName: p.name,
      iconUrl: baseUrl + "/packages/" + encodedPackageId + "/icon",
      description: p.description,
      downloadUrl: baseUrl + "/packages/" + encodedPackageId + "/download",
    }
  });

  res.status(200).json({
    storeName: storeInfo.name,
    storeIcon: baseUrl + '/store/icon',
    packages: storePackages,
  });
}

module.exports = {
  getIcon,
  updateStoreInfo,
  listStorePackage,
}
