const Hashids = require('hashids/cjs');
const config = require('../config');

const key = config.crypt.key;

function encode($data) {
  let hashids = new Hashids(key);

  return hashids.encode($data);
}

function decode($encoded_data) {
  let hashids = new Hashids(key);

  return hashids.decode($encoded_data);
}

module.exports = {
  encode,
  decode
}
