const HttpError = require('./http-error');

class ForbiddenError extends HttpError {
  statusCode = 403;
}

module.exports = ForbiddenError;
