const express = require('express');
const memberRoute = require('./routes/member');
const packageRoute = require('./routes/package');
const storeRoute = require('./routes/store');

const router = express.Router();

memberRoute(router);
packageRoute(router);
storeRoute(router);

module.exports = router;
