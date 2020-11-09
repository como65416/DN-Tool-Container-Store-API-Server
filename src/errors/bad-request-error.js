const HttpError = require('./http-error');

class ForbiddenError extends HttpError {
  statusCode = 400;
}

module.exports = ForbiddenError;
