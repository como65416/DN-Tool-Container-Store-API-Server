const config = require('../config');
const jwt = require('jsonwebtoken');

function generateToken(data, time) {
  const jwtKey = config.jwt.key;
  const payload = {
    data: data,
    exp: parseInt((new Date()).getTime() / 1000) + time,
  };

  const token = jwt.sign(payload, jwtKey);

  return token;
}

function extractTokenData(token) {
  const jwtKey = config.jwt.key;
  const payload = jwt.verify(token, jwtKey);

  if (payload.exp < parseInt((new Date()).getTime() / 1000)) {
    throw new Error('token is expired.');
  }

  return payload.data;
}

module.exports = {
  generateToken,
  extractTokenData,
}
