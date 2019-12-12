const Hashids = require('hashids/cjs')

const key = process.env.CRYPTO_KEY;

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