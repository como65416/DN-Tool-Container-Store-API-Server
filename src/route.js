const express = require('express');
const router = express.Router();
const login = require('./actions/member').login;
const updatePassword = require('./actions/member').updatePassword;
const updateProfile = require('./actions/member').updateProfile;
const addNewPackage = require('./actions/package').addNewPackage;
const updatePackage = require('./actions/package').updatePackage;
const deletePackage = require('./actions/package').deletePackage;
const listPackages = require('./actions/package').listPackages;
const listStorePackage = require('./actions/package').listStorePackage;
const downloadPackage = require('./actions/package').downloadPackage;
const getPackageIcon = require('./actions/package').getPackageIcon;
const checkJWTMiddleware = require('./middlewares/jwt-middleware').checkJWTMiddleware;

router.get('/store-packages', listStorePackage);
router.get('/packages/:id/icon', getPackageIcon);
router.get('/packages/:id/download', downloadPackage);
router.post('/login', login);
router.post('/user/update-password', [checkJWTMiddleware], updatePassword);
router.post('/user/update-profile', [checkJWTMiddleware], updateProfile);
router.get('/packages', [checkJWTMiddleware], listPackages);
router.post('/packages', [checkJWTMiddleware], addNewPackage);
router.put('/packages/:id', [checkJWTMiddleware], updatePackage);
router.delete('/packages/:id', [checkJWTMiddleware], deletePackage);

module.exports = router;
