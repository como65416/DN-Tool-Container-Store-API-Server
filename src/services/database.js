let knex = null;

function getQuery() {
  if (knex == null) {
    knex = require('knex')({
      client: 'mysql',
      connection: {
        host : process.env.DATABASE_HOST,
        user : process.env.DATABASE_USERNAME,
        password : process.env.DATABASE_PASSWORD,
        database : process.env.DATABASE_NAME
      },
      useNullAsDefault: true
    });
  }

  return knex;
}

function destroy() {
  if (knex != null) {
    knex.destroy();
  }
}

module.exports = {
    getQuery,
    destroy
}