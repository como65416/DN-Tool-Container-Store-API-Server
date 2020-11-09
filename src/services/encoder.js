const Hashids = require('hashids/cjs');
const config = require('../config');

const { key } = config.crypt;

function encodeId($id) {
  const hashids = new Hashids(key);

  return hashids.encode($id);
}

function decodeId($encodedId) {
  const hashids = new Hashids(key);

  return hashids.decode($encodedId)[0] || null;
}

module.exports = {
  encodeId,
  decodeId,
};
