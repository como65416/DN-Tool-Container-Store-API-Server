const jwtService = require('../services/jwt');

function checkJWTMiddleware(req, res, next) {
  try {
    let authorization = req.header('Authorization');
    let token = authorization.match(/^Bearer +(.*?)$/)[1];
    let data = jwtService.extractTokenData(token);

    Object.assign(res.locals, {
      username: data.username,
    });
  } catch (e) {
    return res.status(401).json({message: 'token not valid'}).end();
  }

  next();
}

module.exports = checkJWTMiddleware;
