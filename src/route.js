const express = require('express');
const router = express.Router();
const login = require('./actions/member').login;
const updatePassword = require('./actions/member').updatePassword;
const checkJWTMiddleware = require('./middlewares/jwt-middleware').checkJWTMiddleware;

router.post('/login', login);
router.post('/updatePassword', [checkJWTMiddleware], updatePassword);

module.exports = router;
