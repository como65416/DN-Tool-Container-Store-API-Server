const express = require('express');
const route = require('./src/route');
const bodyParser = require('body-parser');
const corsMiddleware = require('./src/middlewares/cors-middleware').corsMiddleware;

// read .env config
require('dotenv').config({ path : '.env'});

let app = express();

// config for json content
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// middleware
app.use(corsMiddleware);

// route
app.use('/', route);

// Error Handler
app.use(function(err, req, res, next) {
  res.status(500).send('Something broke!');
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});
