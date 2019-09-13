var express = require('express');
var router = express.Router();
var login = require('./actions/member').login;

router.post('/login', login);

module.exports = router;
