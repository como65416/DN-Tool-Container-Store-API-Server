const bcrypt = require('bcrypt');
const accountService = require('../services/account.js');
const database = require('../services/database.js');
const jwt = require('jsonwebtoken');

/**
 * @apiParam {String} username User account username.
 * @apiParam {String} password User password.
 */
async function login(req, res) {
  res.setHeader('Content-Type', 'application/json');
  let username = req.body.username;
  let password = req.body.password;
  let query = database.getQuery();

  if (await accountService.checkAccountPassword(query, username, password)) {
    let jwt_key = process.env.JWT_KEY;

    let payload = {
      username: username,
      exp: parseInt((new Date()).getTime() / 1000) + 86400
    };
    let token = jwt.sign(payload, jwt_key);

    res.status(200).send({
      token : token
    })

    return;
  }

  res.status(401).send({'message': 'login fail'});
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} password      User account username.
 */
async function updatePassword(req, res) {
  let username = res.locals.username;
  let password = req.body.password;
  let query = database.getQuery();

  if (password == null || password.length < 8) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).send({message: 'password needs to be at least 8 characters'});
    return;
  }

  const trx = await query.transaction();
  try {
    let hashed_password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    await accountService.updateAccountData(trx, username, {password: hashed_password});
    await trx.commit();
  } catch (e) {
    await trx.rollback();
    throw e;
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(204).send('');
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} name          User name.
 */
async function updateProfile(req, res) {
  let username = res.locals.username;
  let name = req.body.name;
  let query = database.getQuery();

  if (name == null || name.length < 1) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).send({message: 'name needs to be at least 1 characters'});
  }

  const trx = await query.transaction();
  try {
    await accountService.updateAccountData(trx, username, {name});
    await trx.commit();
  } catch (e) {
    await trx.rollback();
    throw e;
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(204).send('');
}

module.exports = {
  login,
  updatePassword,
  updateProfile
}