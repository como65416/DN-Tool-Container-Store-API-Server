const encoder = require('../../libs/encoder');
const fs = require('fs');
const packageService = require('../../services/package');
const Router = require('express').Router;
const store = require('../../services/store');
const checkJWTMiddleware = require('../middlewares/jwt-middleware');
const packagePermissionMiddleware = require('../middlewares/permission-middleware');
const { celebrate, Joi, errors, Segments } = require('celebrate');

const router = Router();

module.exports = (app) => {
  app.use('/packages', router);
  app.use(errors());

  /**
   * @apiHeader {String} Authorization JWT token.
   */
  router.get('', [checkJWTMiddleware], async (req, res) => {
    let baseUrl = req.protocol + "://" + req.headers.host;
    let username = res.locals.username;
    let packages = await packageService.getUserPackages(username);

    packages = packages.map(p => {
      let encodedPackageId = encoder.encodeId(p.id.toString());

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
    let username = res.locals.username;
    let name = req.body.name;
    let description = req.body.description;
    let packageFilePath = (req.files != null) ? req.files.packageFile.tempFilePath : null;

    let packageId = await packageService.createPackage(username, {name, description}, packageFilePath);

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
    let packageId = encoder.decodeId(req.params.id);
    let name = req.body.name;
    let description = req.body.description;
    let packageFilePath = (req.files != null) ? req.files.packageFile.tempFilePath : null;

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
    let packageId = encoder.decodeId(req.params.id);

    await packageService.deletePackage(packageId);

    res.status(204).send('')
  });

  /**
   * @apiParam  {String} id            package id
   */
  router.get('/:id/icon', async (req, res) => {
    let packageId = encoder.decodeId(req.params.id);
    let iconFilePath = await packageService.getPackageIconPath(packageId);

    if (iconFilePath == null) {
      return res.status(404).send('Not found').end();
    }

    res.status(200).sendFile(iconFilePath);
  });

  /**
   * @apiParam  {String} id            package id
   */
  router.get('/:id/download', async (req, res) => {
    let packageId = encoder.decodeId(req.params.id);
    let packageFilePath = await packageService.getPackageZipPath(packageId);

    if (packageFilePath == null) {
      return res.status(404).send('Not found').end();
    }

    res.status(200).sendFile(packageFilePath);
  });
}
