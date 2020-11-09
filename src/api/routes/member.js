const Router = require('express').Router;
const accountService = require('../../services/account');
const jwtService = require('../../services/jwt');
const checkJWTMiddleware = require('../middlewares/jwt-middleware');
const { celebrate, Joi, errors, Segments } = require('celebrate');
const UnauthorizedError = require('../../errors/unauthorized-error');

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
  }), async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!await accountService.checkAccountPassword(username, password)) {
      return next(new UnauthorizedError('login fail'));
    }

    const token = jwtService.generateToken({username}, 86400);

    return res.status(200).json({token}).end();
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
    const username = res.locals.username;
    const password = req.body.password;

    await accountService.updateAccountData(username, {password});

    res.status(204).send('');
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} name          User name.
   */
  router.put('/update-profile', celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().min(1),
    }),
  }), [checkJWTMiddleware], async (req, res) => {
    const username = res.locals.username;
    const name = req.body.name;

    await accountService.updateAccountData(username, {name});

    res.status(204).send('').end();
  });
}
