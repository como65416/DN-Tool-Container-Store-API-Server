const crypto = require('crypto');

const algorithm = 'AES-256-CBC';
const key = process.env.CRYPTO_KEY;
const iv_length = 16;

function encrypt(data)
{
  let iv = crypto.randomBytes(iv_length);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(data);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + '.' + encrypted.toString('hex');
}

function decrypt(data)
{
  let texts = data.split('.');
  let iv = Buffer.from(texts[0], 'hex');
  let encryptedData = Buffer.from(texts[1], 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedData);

  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = {
  encrypt,
  decrypt
}
