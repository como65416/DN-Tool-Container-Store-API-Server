const jwt = require('jsonwebtoken');
const config = require('../config');

function generateToken(data, time) {
  const jwtKey = config.jwt.key;
  const payload = {
    data,
    exp: parseInt((new Date()).getTime() / 1000, 10) + time,
  };

  const token = jwt.sign(payload, jwtKey);

  return token;
}

function extractTokenData(token) {
  const jwtKey = config.jwt.key;
  const payload = jwt.verify(token, jwtKey);

  if (payload.exp < parseInt((new Date()).getTime() / 1000, 10)) {
    throw new Error('token is expired.');
  }

  return payload.data;
}

module.exports = {
  generateToken,
  extractTokenData,
};
