const encoder = require('../../libs/encoder');
const fs = require('fs');
const packageService = require('../../services/package');
const Router = require('express').Router;
const store = require('../../services/store');
const checkJWTMiddleware = require('../middlewares/jwt-middleware');
const packagePermissionMiddleware = require('../middlewares/permission-middleware');
const { celebrate, Joi, errors, Segments } = require('celebrate');
const NotFoundError = require('../../errors/not-found-error');

const router = Router();

module.exports = (app) => {
  app.use('/packages', router);
  app.use(errors());

  /**
   * @apiHeader {String} Authorization JWT token.
   */
  router.get('', [checkJWTMiddleware], async (req, res) => {
    const baseUrl = req.protocol + "://" + req.headers.host;
    const username = res.locals.username;
    const packages = (await packageService.getUserPackages(username))
      .map(p => {
        const encodedPackageId = encoder.encodeId(p.id.toString());

        return {
          packageId: encodedPackageId,
          packageName: p.name,
          version: p.version,
          iconUrl: baseUrl + "/packages/" + encodedPackageId + "/icon",
          description: p.description,
          status: p.status,
        };
      });

    return res.status(200).json(packages).end();
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} name              package name
   * @apiParam  {String} description       package description]
   * @apiParam  {File}   packageFile       package file zip
   */
  router.post('', [checkJWTMiddleware], celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }),
  }), async (req, res) => {
    const username = res.locals.username;
    const name = req.body.name;
    const description = req.body.description;
    const packageFilePath = (req.files != null) ? req.files.packageFile.tempFilePath : null;

    const packageId = await packageService.createPackage(username, {name, description}, packageFilePath);

    if (packageFilePath != null) {
      fs.unlinkSync(packageFilePath);
    }

    res.status(201).send({
      packageId: encoder.encodeId(packageId)
    });
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} id            package id
   * @apiParam  {String} name          package name
   * @apiParam  {String} description   package description]
   * @apiParam  {File}   packageFile   package file zip
   */
  router.put('/:id', [checkJWTMiddleware, packagePermissionMiddleware], celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required(),
      description: Joi.string().required(),
    }),
  }), async (req, res) => {
    const packageId = encoder.decodeId(req.params.id);
    const name = req.body.name;
    const description = req.body.description;
    const packageFilePath = (req.files != null) ? req.files.packageFile.tempFilePath : null;

    await packageService.updatePackage(packageId, {name, description}, packageFilePath);

    if (packageFilePath != null) {
      fs.unlinkSync(packageFilePath);
    }

    res.status(204).send('')
  });

  /**
   * @apiHeader {String} Authorization JWT token.
   * @apiParam  {String} id            package id
   */
  router.delete('/:id', [checkJWTMiddleware, packagePermissionMiddleware], async (req, res) => {
    const packageId = encoder.decodeId(req.params.id);

    await packageService.deletePackage(packageId);

    res.status(204).send('')
  });

  /**
   * @apiParam  {String} id            package id
   */
  router.get('/:id/icon', async (req, res, next) => {
    const packageId = encoder.decodeId(req.params.id);
    const iconFilePath = await packageService.getPackageIconPath(packageId);

    if (iconFilePath == null) {
      return next(new NotFoundError('Not found'));
    }

    res.status(200).sendFile(iconFilePath);
  });

  /**
   * @apiParam  {String} id            package id
   */
  router.get('/:id/download', async (req, res) => {
    const packageId = encoder.decodeId(req.params.id);
    const packageFilePath = await packageService.getPackageZipPath(packageId);

    if (packageFilePath == null) {
      return next(new NotFoundError('Not found'));
    }

    res.status(200).sendFile(packageFilePath);
  });
}
