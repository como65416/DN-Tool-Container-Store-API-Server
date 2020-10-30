const jwt = require('jsonwebtoken');

function generateToken(data, time) {
  let jwt_key = process.env.JWT_KEY;
  let payload = {
    data: data,
    exp: parseInt((new Date()).getTime() / 1000) + time,
  };

  let token = jwt.sign(payload, jwt_key);

  return token;
}

function extractTokenData(token) {
  let jwt_key = process.env.JWT_KEY;
  let payload = jwt.verify(token, jwt_key);

  if (payload.exp < parseInt((new Date()).getTime() / 1000)) {
    throw 'token is expired.';
  }

  return payload.data;
}

module.exports = {
  generateToken,
  extractTokenData,
}
