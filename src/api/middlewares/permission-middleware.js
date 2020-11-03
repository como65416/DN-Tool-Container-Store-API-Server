const packageService = require('../../services/package');
const encoder = require('../../libs/encoder');

async function checkPackagePermission (req, res, next) {
  let username = res.locals.username;
  let packageId = encoder.decodeId(req.params.id);
  let package = await packageService.getPackageInfo(packageId);

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
    return;
  }

  next();
}

module.exports = checkPackagePermission;
