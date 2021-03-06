const { Router } = require('express');
const { Container } = require('typedi');
const checkJWTMiddleware = require('../middlewares/jwt-middleware');

const router = Router();

module.exports = (app) => {
  app.use('/store', router);

  const encoderService = Container.get('encoderService');
  const storeService = Container.get('storeService');
  const packageService = Container.get('packageService');

  /**
   * get store icon image
   */
  router.get('/icon', async (req, res) => {
    const iconPath = await storeService.getStoreIconPath();

    res.status(200).sendFile(iconPath);
  });

  /**
   * update store information
   */
  router.put('/info', [checkJWTMiddleware], async (req, res) => {
    const name = req.body.storeName;
    const storeIconPath = (req.files != null) ? req.files.storeIcon.tempFilePath : null;

    await storeService.updateStoreInfo({ name }, storeIconPath);

    res.status(204).send('').end();
  });

  /**
   * get store published packages
   */
  router.get('/packages', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.headers.host}`;
    const storeInfo = await storeService.getStoreInfo();
    const packages = await packageService.getAllPublishedPackages();

    const storePackages = packages.map((p) => {
      const encodedPackageId = encoderService.encodeId(p.id.toString());

      return {
        packageId: encodedPackageId,
        version: p.version,
        packageName: p.name,
        iconUrl: `${baseUrl}/packages/${encodedPackageId}/icon`,
        description: p.description,
        downloadUrl: `${baseUrl}/packages/${encodedPackageId}/download`,
      };
    });

    res.status(200).json({
      storeName: storeInfo.name,
      storeIcon: `${baseUrl}/store/icon`,
      packages: storePackages,
    });
  });
};
