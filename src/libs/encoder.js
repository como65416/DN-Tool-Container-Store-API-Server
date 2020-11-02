const Hashids = require('hashids/cjs');
const config = require('../config');

const key = config.crypt.key;

function encodeId($data) {
  let hashids = new Hashids(key);

  return hashids.encode($data);
}

function decodeId($encoded_data) {
  let hashids = new Hashids(key);

  return hashids.decode($encoded_data)[0] || null;
}

module.exports = {
  encodeId,
  decodeId,
}
