const { Container } = require('typedi');
const config = require('../config');
const AccountService = require('../services/account');
const EncoderService = require('../services/encoder');
const StoreService = require('../services/store');
const PackageService = require('../services/package');
const JwtService = require('../services/jwt');

module.exports = async () => {
  const jwtKey = config.jwt.key;
  const encodeKey = config.crypt.key;

  Container.set('encoderService', new EncoderService(encodeKey));
  Container.set('storeService', new StoreService());
  Container.set('packageService', new PackageService());
  Container.set('jwtService', new JwtService(jwtKey));
  Container.set('accountService', new AccountService());
};
