// read .env config first
require('dotenv').config({ path : '.env'});

const express = require('express');
const fileUpload = require('express-fileupload');
const apiRoute = require('./api');
const bodyParser = require('body-parser');
const corsMiddleware = require('./api/middlewares/cors-middleware');

let app = express();

// use expresss-fileupload
app.use(fileUpload({
  useTempFiles: true,
  limits: { fileSize: 30 * 1024 * 1024 },
}));

// config for json content
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// middleware
app.use(corsMiddleware);

// route
app.use('/', apiRoute);

// Error Handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
}).on('error', err => {
  console.log(err);
  process.exit(1);
});
