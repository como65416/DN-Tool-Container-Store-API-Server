const bodyParser = require('body-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const apiRoute = require('./api');
const corsMiddleware = require('./api/middlewares/cors-middleware');
const errorHandler = require('./errors/handler');

const app = express();

// use expresss-fileupload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: `${__dirname}/../storage/tmp`,
  limits: { fileSize: 30 * 1024 * 1024 },
}));

// config for json content
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// enable cors
app.use(corsMiddleware);

// route
app.use('/', apiRoute);

// error Handler
app.use(errorHandler);

app.listen(3000, () => {
  console.log('app listening on port 3000!');
}).on('error', (err) => {
  console.log(err);
  process.exit(1);
});
