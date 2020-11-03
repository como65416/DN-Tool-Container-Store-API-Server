const Router = require('express').Router;
const accountService = require('../../services/account');
const jwtService = require('../../services/jwt');
const checkJWTMiddleware = require('../middlewares/jwt-middleware');

const router = Router();

module.exports = (app) => {
  app.use('/user', router);

  /**
   * @apiParam {String} username User account username.
   * @apiParam {String} password User password.
   */
  router.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (await accountService.checkAccountPassword(username, password)) {
      let token = jwtService.generateToken({username}, 86400);

      return res.status(200).json({token}).end();
    }

    res.status(401).json({'message': 'login fail'}).end();
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} password      User account username.
   */
  router.put('/update-password', [checkJWTMiddleware], async (req, res) => {
    let username = res.locals.username;
    let password = req.body.password;

    if (password == null || password.length < 8) {
      return res.status(400).json({message: 'password needs to be at least 8 characters'}).end();
    }

    await accountService.updateAccountData(username, {password});

    res.status(204).send('');
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} name          User name.
   */
  router.put('/update-profile', [checkJWTMiddleware], async (req, res) => {
    let username = res.locals.username;
    let name = req.body.name;

    if (name == null || name.length < 1) {
      return res.status(400).json({message: 'name needs to be at least 1 characters'}).end();
    }

    await accountService.updateAccountData(username, {name});

    res.status(204).send('').end();
  });
}
