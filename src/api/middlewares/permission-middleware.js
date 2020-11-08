const packageService = require('../../services/package');
const encoder = require('../../libs/encoder');

async function checkPackagePermission (req, res, next) {
  const username = res.locals.username;
  const packageId = encoder.decodeId(req.params.id);
  const package = await packageService.getPackageInfo(packageId);

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
    return;
  }

  next();
}

module.exports = checkPackagePermission;
