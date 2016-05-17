'use strict';

var Sequelize = require('sequelize')
  , pkg = require('./package.json')
  , defineModels = require('./common/models')
  , createServer = require('./web/server')
  , log = require('./common/logger');

function main() {
  var db = new Sequelize(process.env.DATABASE_URL, { logging: false })
    , opts = {
        name: pkg.name,
        version: pkg.version
      }
    , server;

  defineModels(db);
  server = createServer(db, opts);
  server.listen(process.env.PORT || 5000, function() {
    log.info('%s listening at %s', server.name, server.url);
  });
}

if (require.main === module) {
  main();
}
