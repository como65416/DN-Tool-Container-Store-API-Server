const express = require('express');
const router = express.Router();
const login = require('./actions/member').login;
const updatePassword = require('./actions/member').updatePassword;
const updateProfile = require('./actions/member').updateProfile;
const addNewPackage = require('./actions/package').addNewPackage;
const updatePackage = require('./actions/package').updatePackage;
const deletePackage = require('./actions/package').deletePackage;
const checkJWTMiddleware = require('./middlewares/jwt-middleware').checkJWTMiddleware;

router.post('/login', login);
router.post('/user/update-password', [checkJWTMiddleware], updatePassword);
router.post('/user/update-profile', [checkJWTMiddleware], updateProfile);
router.post('/packages', [checkJWTMiddleware], addNewPackage);
router.put('/packages/:id', [checkJWTMiddleware], updatePackage);
router.delete('/packages/:id', [checkJWTMiddleware], deletePackage);

module.exports = router;
