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

  if (await accountService.checkAccountPassword(username, password)) {
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

  if (password == null || password.length < 8) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).send({message: 'password needs to be at least 8 characters'});
    return;
  }

  let hashed_password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  await accountService.updateAccountData(username, {password: hashed_password});

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({message: 'update success'});
}

/**
 * @apiHeader {String} Authorization JWT token.
 * @apiParam  {String} name          User name.
 */
async function updateProfile(req, res) {
  let username = res.locals.username;
  let name = req.body.name;

  if (name == null || name.length < 1) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).send({message: 'name needs to be at least 1 characters'});
  }

  await accountService.updateAccountData(username, {name});

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({message: 'update success'});
}

module.exports = {
  login,
  updatePassword,
  updateProfile
}