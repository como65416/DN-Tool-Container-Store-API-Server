const express = require('express');
const memberController = require('./controllers/member');
const packageController = require('./controllers/package');
const storeController = require('./controllers/store');
const checkJWTMiddleware = require('./middlewares/jwt-middleware');
const packagePermissionMiddleware = require('./middlewares/permission-middleware');

const router = express.Router();

router.get('/store/packages', storeController.listStorePackage);
router.get('/store/icon', storeController.getIcon);
router.put('/store/info', [checkJWTMiddleware], storeController.updateStoreInfo);

router.post('/user/login', memberController.login);
router.put('/user/update-password', [checkJWTMiddleware], memberController.updatePassword);
router.put('/user/update-profile', [checkJWTMiddleware], memberController.updateProfile);

router.get('/packages/:id/icon', packageController.getPackageIcon);
router.get('/packages/:id/download', packageController.downloadPackage);
router.get('/packages', [checkJWTMiddleware], packageController.listPackages);
router.post('/packages', [checkJWTMiddleware], packageController.addNewPackage);
router.put('/packages/:id', [checkJWTMiddleware, packagePermissionMiddleware], packageController.updatePackage);
router.delete('/packages/:id', [checkJWTMiddleware, packagePermissionMiddleware], packageController.deletePackage);

module.exports = router;
