const HttpError = require('./http-error');

function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({message: err.message}).end();
  }

  res.status(500).json({message: 'Something Unknown broke!'}).end();
}

module.exports = errorHandler;
