'use strict';

var AWS = require('aws-sdk')
  , Sequelize = require('sequelize')
  , bluebird = require('bluebird')
  , defineModels = require('./common/models')
  , createReceiver = require('./worker/receiver')
  , log = require('./common/logger');

function main() {
  AWS.config.setPromisesDependency(bluebird);
  var db = new Sequelize(process.env.DATABASE_URL, { logging: false })
    , sqs = new AWS.SQS();

  defineModels(db);
  log.info('receiving from ' + process.env.QUEUE_URL);
  receiveForever(createReceiver(db, sqs), process.env.QUEUE_URL);
}

function receiveForever(receive, queueUrl) {
  receive(queueUrl)
  .spread(function(messages, recipients, bounces) {
    if (messages) {
      log.info('received', {
        messages: messages.length,
        recipients: recipients.length,
        bounces: bounces.length
      });
    }
  })
  .catch(function(err) {
    log.error(err.message);
  })
  .finally(function() {
    receiveForever(receive, queueUrl);
  });
}

if (require.main === module) {
  main();
}
