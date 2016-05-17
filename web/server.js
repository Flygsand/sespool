'use strict';

var restify = require('restify');

module.exports = function createServer(db, opts) {
  var Bounce = db.models.Bounce
    , Recipient = db.models.Recipient
    , server = restify.createServer(opts);

  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  server.get('/health', function(req, res, next) {
    res.send(200);
    return next();
  });

  server.get('/bouncing', function(req, res, next) {
    return Recipient
      .findAll({
        where: {
          status: 'bouncing'
        },
        include: [Bounce],
        order: [
          [Bounce, 'timestamp', 'DESC']
        ]
      })
      .then(function(recipients) {
        res.send(recipients.map(function(r) {
          var bounce = r.Bounces[0];

          return {
            address: r.address,
            type: bounce.type,
            subType: bounce.subType,
            timestamp: bounce.timestamp
          };
        }));

        return next();
      })
      .error(function(err) {
        return next(err);
      });
  });

  return server;
};
