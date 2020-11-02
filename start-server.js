// read .env config first
require('dotenv').config({ path : '.env'});

const express = require('express');
const fileUpload = require('express-fileupload');
const route = require('./src/route');
const bodyParser = require('body-parser');
const corsMiddleware = require('./src/middlewares/cors-middleware');

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
app.use('/', route);

// Error Handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});
