const dotenv = require('dotenv');

dotenv.config({ path : '.env'});

module.exports = {
  database: {
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  crypt: {
    key: process.env.AVAILABLE_DOMAINS,
  },
  jwt: {
    key: process.env.JWT_KEY,
  },
  cors: {
    domains: process.env.AVAILABLE_DOMAINS.split(',') || [],
  }
};
