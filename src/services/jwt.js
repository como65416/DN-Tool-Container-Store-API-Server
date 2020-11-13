const jwt = require('jsonwebtoken');

class Jwt {
  key = '';

  constructor(key) {
    this.key = key;
  }

  generateToken(data, time) {
    const payload = {
      data,
      exp: parseInt((new Date()).getTime() / 1000, 10) + time,
    };

    const token = jwt.sign(payload, this.key);

    return token;
  }

  extractTokenData(token) {
    const payload = jwt.verify(token, this.key);

    if (payload.exp < parseInt((new Date()).getTime() / 1000, 10)) {
      throw new Error('token is expired.');
    }

    return payload.data;
  }
}

module.exports = Jwt;
