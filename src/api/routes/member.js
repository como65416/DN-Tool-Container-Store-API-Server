const Router = require('express').Router;
const accountService = require('../../services/account');
const jwtService = require('../../services/jwt');
const checkJWTMiddleware = require('../middlewares/jwt-middleware');
const { celebrate, Joi, errors, Segments } = require('celebrate');

const router = Router();

module.exports = (app) => {
  app.use('/user', router);
  app.use(errors());

  /**
   * @apiParam {String} username User account username.
   * @apiParam {String} password User password.
   */
  router.post('/login', celebrate({
    [Segments.BODY]: Joi.object().keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    }),
  }), async (req, res) => {
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
  router.put('/update-password', [checkJWTMiddleware], celebrate({
    [Segments.BODY]: Joi.object().keys({
      password: Joi.string().min(8).required(),
    }),
  }), async (req, res) => {
    let username = res.locals.username;
    let password = req.body.password;

    await accountService.updateAccountData(username, {password});

    res.status(204).send('');
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} name          User name.
   */
  router.put('/update-profile', celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string(),
    }),
  }), [checkJWTMiddleware], async (req, res) => {
    let username = res.locals.username;
    let name = req.body.name;

    if (name == null || name.length < 1) {
      return res.status(400).json({message: 'name needs to be at least 1 characters'}).end();
    }

    await accountService.updateAccountData(username, {name});

    res.status(204).send('').end();
  });
}
