var express = require('express');
var route = require('./src/route');
var bodyParser = require('body-parser');

// read .env config
require('dotenv').config({ path : '.env'});

var app = express();

// config for json content
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// route
app.use('/', route);

// Error Handler
app.use(function(err, req, res, next) {
  res.status(500).send('Something broke!');
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});
