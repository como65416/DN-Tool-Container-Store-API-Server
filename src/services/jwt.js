const config = require('../config');
const jwt = require('jsonwebtoken');

function generateToken(data, time) {
  let jwtKey = config.jwt.key;
  let payload = {
    data: data,
    exp: parseInt((new Date()).getTime() / 1000) + time,
  };

  let token = jwt.sign(payload, jwtKey);

  return token;
}

function extractTokenData(token) {
  let jwtKey = config.jwt.key;
  let payload = jwt.verify(token, jwtKey);

  if (payload.exp < parseInt((new Date()).getTime() / 1000)) {
    throw new Error('token is expired.');
  }

  return payload.data;
}

module.exports = {
  generateToken,
  extractTokenData,
}
