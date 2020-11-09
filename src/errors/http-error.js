class HttpError extends Error {
  statusCode = 500;
}

module.exports = HttpError;
