'use strict';

var hippie = require('hippie')
  , Sequelize = require('sequelize')
  , defineModels = require('../../../common/models')
  , createServer = require('../../../web/server');

describe('web/server', function() {
  describe('/bouncing', function() {
    it('returns a list of bouncing recipients', function() {
      var db = new Sequelize(process.env.DATABASE_URL);
      defineModels(db);
      return db.sync({force : true})
      .then(function() {
        var Recipient = db.models.Recipient
          , Bounce = db.models.Bounce;

        return Recipient.create({
          address: 'foo@example.com',
          status: 'bouncing'
        })
        .then(function(recipient) {
          return Bounce.bulkCreate([
            {
              id: 'deadbeef',
              type: 'Permanent',
              subType: 'NoEmail',
              timestamp: '2014-01-01 15:00:00 +00:00'
            },
            {
              id: 'deadcafe',
              type: 'Permanent',
              subType: 'Suppressed',
              timestamp: '2014-01-01 16:00:00 +00:00'

            }
          ])
          .then(function(bounces) {
            return recipient.setBounces(bounces);
          });
        });
      })
      .then(function() {
        var server = createServer(db);
        return hippie(server)
        .json()
        .get('/bouncing')
        .expectStatus(200)
        .expectBody([
          {
            address: 'foo@example.com',
            type: 'Permanent',
            subType: 'Suppressed',
            timestamp: '2014-01-01T16:00:00.000Z'
          }
        ])
        .end();
      });
    });
  });
});
