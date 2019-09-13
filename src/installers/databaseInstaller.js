const bcrypt = require('bcrypt');
const database = require('../libs/database.js');

// databasse table schema
let table_schemas = {
  account: (t) => {
    t.increments('id').primary();
    t.string('username', 50);
    t.string('password', 200);
    t.string('name', 30);
    t.unique('username');
  },
  permission: (t) => {
    t.increments('id').primary();
    t.string('name', 50);
    t.string('description', 50);
  },
  account_permission: (t) => {
    t.increments('id').primary();
    t.string('username', 50);
    t.integer('permission_id').unsigned();
    t.index('username');
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

  await dbQuery.table('account').insert([
    {username: 'admin', password: bcrypt.hashSync('admin', 10), name: 'Admin'}
  ]);

  await dbQuery.table('permission').insert([
    {id: 1, name: 'CREATE_ACCOUNT', description: 'Create new account'},
    {id: 2, name: 'BLOCK_ACCOUNT', description: 'Block the account'},
    {id: 3, name: 'RESET_ACCOUNT_PASSWORD', description: 'Reset account password'},
    {id: 4, name: 'MANAGE_ACCOUNT_PERMISSION', description: 'Assign permission to account'},
    {id: 5, name: 'REVIEW_OTHER_USER_PACKAGE', description: 'Review new package'},
    {id: 6, name: 'DELETE_OTHER_USER_PACKAGE', description: 'Delete package'},
  ]);

  await dbQuery.table('account_permission').insert([
    {username: 'admin', permission_id: 1},
    {username: 'admin', permission_id: 2},
    {username: 'admin', permission_id: 3},
    {username: 'admin', permission_id: 4},
    {username: 'admin', permission_id: 5},
    {username: 'admin', permission_id: 6},
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