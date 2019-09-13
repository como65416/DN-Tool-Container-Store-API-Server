const bcrypt = require('bcrypt');
const database = require('../libs/database.js');
const jwt = require('jsonwebtoken');

async function login(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let username = req.body.username;
  let password = req.body.password;

  let dbQuery = database.getQuery();
  let accountData = await dbQuery.table('account')
    .where('username', '=', username)
    .first();

  if (accountData != null && bcrypt.compareSync(password, accountData.password)) {
    let jwt_key = process.env.JWT_KEY;

    let accountPermissions = await dbQuery.table('account_permission')
      .select('permission_id')
      .where('username', '=', username);
    let permissions = await dbQuery.table('permission')
      .select('name')
      .whereIn('id', accountPermissions.map(d => d.permission_id));

    let payload = {
      username: req.body.username,
      permission: permissions.map(d => d.name),
      exp: parseInt((new Date()).getTime() / 1000) + 86400
    };
    let token = jwt.sign(payload, jwt_key);

    res.send({
      success : true,
      token : token
    })

    return;
  }
  res.send({success: false});
}

module.exports = {
  login
}