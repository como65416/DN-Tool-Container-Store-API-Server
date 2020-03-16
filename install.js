const dotenv = require('dotenv');
const fs = require('fs');
const database = require('./src/services/database.js');
const databaseInstaller = require('./src/installers/databaseInstaller.js');
const cryptoRandomString = require('crypto-random-string');
const inquirer = require('inquirer');

inquirer.prompt([
  {
    type: 'input',
    name: 'db_ip',
    message: 'Database IP or Domain :'
  },
  {
    type: 'input',
    name: 'db_account',
    message: 'Database account :'
  },
  {
    type: 'password',
    name: 'db_password',
    message: 'Database password :'
  },
  {
    type: 'input',
    name: 'db_name',
    message: 'Database name :'
  },
  {
    type: 'input',
    name: 'cors_available_domains',
    message: 'CORS available domains:'
  }
])
.then(answers => {
  let jwt_key = cryptoRandomString({length: 32, type: 'base64'});
  let crypto_key = cryptoRandomString({length: 32, type: 'base64'});

  // generate .env content
  let env_content = '';
  env_content += '# JWT\n';
  env_content += 'JWT_KEY=' + jwt_key + '\n';
  env_content += '\n';

  env_content += '# MYSQL DATABASE' + '\n';
  env_content += 'DATABASE_HOST=' + answers.db_ip + '\n';
  env_content += 'DATABASE_USERNAME=' + answers.db_account + '\n';
  env_content += 'DATABASE_PASSWORD=' + answers.db_password + '\n';
  env_content += 'DATABASE_NAME=' + answers.db_name + '\n';
  env_content += '\n';

  env_content += '# CORS' + '\n';
  env_content += 'AVAILABLE_DOMAINS=' + answers.cors_available_domains + '\n';
  env_content += '\n';

  env_content += '# CRYPTO' + '\n';
  env_content += 'CRYPTO_KEY=' + crypto_key + '\n';

  // save and locd .env file
  let env_path = __dirname + "/.env";
  fs.writeFileSync(env_path, env_content);
  dotenv.config({ path : '.env'});

  // init database
  databaseInstaller.install()
    .then(() => {
      console.log('\x1b[32m%s\x1b[0m', 'Install database success.');
    })
    .catch((e) => {
      console.log('\x1b[31m%s\x1b[0m', 'Install database fail :', e.message);
    });
})
.catch(err => {
  console.log('input data error :', err);
});
