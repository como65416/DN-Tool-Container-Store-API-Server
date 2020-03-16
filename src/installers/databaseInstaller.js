const bcrypt = require('bcrypt');
const database = require('../services/database.js');

// database table schema
let table_schemas = {
  account: (t) => {
    t.increments('id').primary();
    t.string('username', 50);
    t.string('password', 200);
    t.string('name', 30);
    t.unique('username');
  },
  package: (t) => {
    t.increments('id').primary();
    t.string('version', 20);
    t.string('name', 60);
    t.string('icon_filename', 80);
    t.string('description', 300);
    t.string('package_filename', 80);
    t.string('publish_username', 50);
    t.string('status', 10);
    t.index('publish_username');
    t.index('status');
  },
  store_option: (t) => {
    t.increments('id').primary();
    t.string('option_name', 20);
    t.string('option_value', 100);
  }
}

async function checkTable() {
  let dbQuery = database.getQuery();

  for (let table of Object.keys(table_schemas)) {
    if (await dbQuery.schema.hasTable(table)) {
      throw new Error('table [' + table + '] already exists')
    }
  }
}

async function initTableSchema() {
  let dbQuery = database.getQuery();

  for (let table_name in table_schemas) {
    await dbQuery.schema.createTable(table_name, table_schemas[table_name]);
  }
}

async function initTableData() {
  let dbQuery = database.getQuery();

  let salt = bcrypt.genSaltSync(10);
  await dbQuery.table('account').insert([
    {username: 'admin', password: bcrypt.hashSync('admin', salt), name: 'Admin'}
  ]);

  await dbQuery.table('store_option').insert([
    {option_name: 'store_name', option_value: 'My Custom DN Tool Package Store'},
    {option_name: 'icon_filename', option_value: ''},
  ]);
}

async function install() {
  try {
    await checkTable();
    // create database
    await initTableSchema();
    await initTableData();
  } finally {
    database.getQuery().destroy();
  }
}

module.exports = {
  install
}