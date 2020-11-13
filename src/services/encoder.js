const Hashids = require('hashids/cjs');

class Encoder {
  key = '';

  constructor(key) {
    this.key = key;
  }

  encodeId($id) {
    const hashids = new Hashids(this.key);

    return hashids.encode($id);
  }

  decodeId($encodedId) {
    const hashids = new Hashids(this.key);

    return hashids.decode($encodedId)[0] || null;
  }
}

module.exports = Encoder;
