const packageService = require('../../services/package');
const encoderService = require('../../services/encoder');
const ForbiddenError = require('../../errors/forbidden-error');

async function checkPackagePermission(req, res, next) {
  const { username } = res.locals;
  const packageId = encoderService.decodeId(req.params.id);
  const thePackage = await packageService.getPackageInfo(packageId);

  if (thePackage == null || thePackage.publish_username !== username) {
    return next(new ForbiddenError('Forbidden'));
  }

  return next();
}

module.exports = checkPackagePermission;
