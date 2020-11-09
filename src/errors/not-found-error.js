const HttpError = require('./http-error');

class NotFoundError extends HttpError {
  statusCode = 404;
}

module.exports = NotFoundError;
