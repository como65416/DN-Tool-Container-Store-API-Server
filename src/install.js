const dotenv = require('dotenv');
const fs = require('fs');
const cryptoRandomString = require('crypto-random-string');
const inquirer = require('inquirer');
const { Sequelize } = require('sequelize');
const databaseInstaller = require('./installers/database-installer.js');

inquirer.prompt([
  {
    type: 'input',
    name: 'db_ip',
    message: 'Database IP or Domain :',
  },
  {
    type: 'input',
    name: 'db_account',
    message: 'Database account :',
  },
  {
    type: 'password',
    name: 'db_password',
    message: 'Database password :',
  },
  {
    type: 'input',
    name: 'db_name',
    message: 'Database name :',
  },
  {
    type: 'input',
    name: 'cors_available_domains',
    message: 'CORS available domains:',
  },
])
  .then(async (answers) => {
    const jwtKey = cryptoRandomString({ length: 32, type: 'base64' });
    const cryptoKey = cryptoRandomString({ length: 32, type: 'base64' });

    // generate .env content
    let envContent = '';
    envContent += '# JWT\n';
    envContent += `JWT_KEY=${jwtKey}\n`;
    envContent += '\n';

    envContent += '# MYSQL DATABASE\n';
    envContent += `DATABASE_HOST=${answers.db_ip}\n`;
    envContent += `DATABASE_USERNAME=${answers.db_account}\n`;
    envContent += `DATABASE_PASSWORD=${answers.db_password}\n`;
    envContent += `DATABASE_NAME=${answers.db_name}\n`;
    envContent += '\n';

    envContent += '# CORS\n';
    envContent += `AVAILABLE_DOMAINS=${answers.cors_available_domains}\n`;
    envContent += '\n';

    envContent += '# CRYPTO\n';
    envContent += `CRYPTO_KEY=${cryptoKey}\n`;

    // save and locd .env file
    const envPath = `${__dirname}/.env`;
    fs.writeFileSync(envPath, envContent);
    dotenv.config({ path: '.env' });

    // init database
    const sequelize = new Sequelize(answers.db_name, answers.db_account, answers.db_password, {
      host: answers.db_ip,
      dialect: 'mysql',
      logging: false,
    });
    try {
      await databaseInstaller.install(sequelize);
      await sequelize.close();
      console.log('\x1b[32m%s\x1b[0m', 'Install database success.');
    } catch (e) {
      console.log('\x1b[31m%s\x1b[0m', 'Install database fail :', e.message);
    }
  })
  .catch((err) => {
    console.log('input data error :', err);
  });
