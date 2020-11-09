const packageService = require('../../services/package');
const encoder = require('../../libs/encoder');
const ForbiddenError = require('../../errors/forbidden-error');
const UnauthorizedError = require('../../errors/unauthorized-error');

async function checkPackagePermission(req, res, next) {
  const username = res.locals.username;
  const packageId = encoder.decodeId(req.params.id);
  const package = await packageService.getPackageInfo(packageId);

  if (package == null || package.publish_username !== username) {
    return next(new UnauthorizedError('Unauthorized'));
  }

  next();
}

module.exports = checkPackagePermission;
