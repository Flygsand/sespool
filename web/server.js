'use strict';

var restify = require('restify')
  , url = require('url')
  , util = require('util')
  , BadRequestError = restify.errors.BadRequestError;

function setLink(req, res, currentPage, totalPages) {
  var u = url.parse(req.url, true)
    , q = u.query
    , links = [];
  u.protocol = req.header('X-Forwarded-Proto') || (req.isSecure() ? 'https' : 'http');
  u.host = req.header('X-Forwarded-Host') || req.header('Host');

  if (totalPages === 0 || currentPage > totalPages) return;

  if (currentPage > 1) {
    q.page = 1; delete u.search;
    links.push(util.format('<%s>; rel="first"', url.format(u)));
    q.page = currentPage - 1; delete u.search;
    links.push(util.format('<%s>; rel="prev"', url.format(u)));
  }

  if (currentPage < totalPages) {
    q.page = currentPage + 1; delete u.search;
    links.push(util.format('<%s>; rel="next"', url.format(u)));
    q.page = totalPages; delete u.search;
    links.push(util.format('<%s>; rel="last"', url.format(u)));
  }

  if (links.length > 0) {
    res.setHeader('Link', links.join(', '));
  }
}

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
    var perPage = parseInt(req.params.perPage) || 100
      , page = parseInt(req.params.page) || 1;

    if (page < 1) {
      return next(new BadRequestError('invalid page'));
    }

    if (perPage < 10 || perPage > 100) {
      return next(new BadRequestError('invalid perPage'));
    }

    return Recipient
      .findAndCountAll({
        where: {
          status: 'bouncing'
        },
        include: [Bounce],
        order: [
          [Bounce, 'timestamp', 'DESC']
        ],
        offset: (page - 1) * perPage,
        limit: perPage
      })
      .then(function(recipients) {
        setLink(req, res, page, Math.ceil(recipients.count / perPage));
        res.send(recipients.rows.map(function(r) {
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
