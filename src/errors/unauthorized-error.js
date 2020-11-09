const HttpError = require('./http-error');

class UnauthorizedError extends HttpError {
  statusCode = 401;
}

module.exports = UnauthorizedError;
