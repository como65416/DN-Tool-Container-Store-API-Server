const { Container } = require('typedi');
const UnauthorizedError = require('../../errors/unauthorized-error');

function checkJWTMiddleware(req, res, next) {
  const jwtService = Container.get('jwtService');

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
