const jwtService = require('../../services/jwt');
const UnauthorizedError = require('../../errors/unauthorized-error');

function checkJWTMiddleware(req, res, next) {
  try {
    const authorization = req.header('Authorization');
    const token = authorization.match(/^Bearer +(.*?)$/)[1];
    const data = jwtService.extractTokenData(token);

    Object.assign(res.locals, {
      username: data.username,
    });
  } catch (e) {
    return next(new UnauthorizedError('token not valid'));
  }

  return next();
}

module.exports = checkJWTMiddleware;
