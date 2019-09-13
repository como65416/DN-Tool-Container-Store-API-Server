const dotenv = require('dotenv');
const fs = require('fs');
const database = require('./src/libs/database.js');
const databaseInstaller = require('./src/installers/databaseInstaller.js');

// check .env file exist or not
let envFilePath = '.env';
if (!fs.existsSync(envFilePath)) {
  console.log('.env file not found');
  return;
}
dotenv.config({ path : '.env'});

// check .env config
let required_config = [
  'JWT_KEY',
  'DATABASE_HOST',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
];

let valid = true;
for (let field of required_config) {
  if (!process.env[field]) {
    console.log('not set [' + field + '] value in .env file');
    valid = false;
  }
}

if (!valid) {
  return;
}

// install database
databaseInstaller.install()
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', 'Install database success.');
  })
  .catch((e) => {
    console.log('\x1b[31m%s\x1b[0m', 'Install database fail :');
    console.log('    ' + e.message);
  });
