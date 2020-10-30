const packageService = require('../services/package.js');
const encoder = require('../libs/encoder.js');

async function checkPackagePermission (req, res, next) {
  let username = res.locals.username;
  let packageId = encoder.decode(req.params.id)[0] || 0 ;
  let package = await packageService.getPackageInfo(packageId);

  if (package == null || package.publish_username != username) {
    res.status(401).send({'message': 'Unauthorized'});
    return;
  }

  next();
}

module.exports = {
  checkPackagePermission,
}
