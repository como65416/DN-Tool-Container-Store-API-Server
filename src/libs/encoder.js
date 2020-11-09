const Hashids = require('hashids/cjs');
const config = require('../config');

const key = config.crypt.key;

function encodeId($id) {
  const hashids = new Hashids(key);

  return hashids.encode($id);
}

function decodeId($encoded_id) {
  const hashids = new Hashids(key);

  return hashids.decode($encoded_id)[0] || null;
}

module.exports = {
  encodeId,
  decodeId,
}
