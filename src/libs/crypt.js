const crypto = require('crypto');

const algorithm = 'AES-256-CBC';
const key = process.env.CRYPTO_KEY;
const iv_length = 16;

/**
 * @param  {String} data original data
 * @return {String}      encrypted data
 */
function encrypt(data) {
  let iv = crypto.randomBytes(iv_length);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(data);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + '.' + encrypted.toString('hex');
}

/**
 * @param  {String} data encrypted data
 * @return {String|null} decrypted data or null when decrypt fail
 */
function decrypt(data) {
  try {
    let texts = data.split('.');
    let iv = Buffer.from(texts[0], 'hex');
    let encryptedData = Buffer.from(texts[1], 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedData);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
}
