const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const apiRoute = require('../api');
const corsMiddleware = require('../api/middlewares/cors-middleware');
const errorHandler = require('../errors/handler');

module.exports = async (app) => {
  // use expresss-fileupload
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: `${__dirname}/../../storage/tmp`,
    limits: { fileSize: 30 * 1024 * 1024 },
  }));

  // config for json content
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // enable cors
  app.use(corsMiddleware);

  // route
  app.use('/', apiRoute());

  // error Handler
  app.use(errorHandler);
};
