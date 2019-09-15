
function corsMiddleware (req, res, next) {
  let enableCors = process.env.ENABLE_CORS;
  let availableDomains = process.env.AVAILABLE_DOMAINS.split(',');

  let url = new URL(req.get('origin'));
  if (enableCors == 'true' && availableDomains.includes(url.host)) {
    res.header('Access-Control-Allow-Origin', req.get('origin'));
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', 300);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  if (req.method == 'OPTIONS') {
      res.status(200).send('');
      return;
  }

  next();
}

module.exports = {
  corsMiddleware
}