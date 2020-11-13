const express = require('express');
const dependencyInjectorLoader = require('./loaders/dependency-injector');
const expressLoader = require('./loaders/express');

async function startServer() {
  const app = express();

  // run loader
  await dependencyInjectorLoader();
  await expressLoader(app);

  app.listen(3000, () => {
    console.log('app listening on port 3000!');
  }).on('error', (err) => {
    console.log(err);
    process.exit(1);
  });
}

startServer();
