const jwt = require('jsonwebtoken');

function checkJWTMiddleware(req, res, next) {
  try {
    let authorization = req.header('Authorization');
    let match = authorization.match(/^Bearer +(.*?)$/);
    let jwt_key = process.env.JWT_KEY;
    let payload = jwt.verify(match[1], jwt_key);

    if (payload.exp > parseInt((new Date()).getTime() / 1000)) {
      Object.assign(res.locals, {
        username: payload.username,
      });
      next();
      return;
    }
  } catch (e) {
    // do nothing
  }

  res.status(401).send('token not valid');
}

module.exports = {
  checkJWTMiddleware
}
