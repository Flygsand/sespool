'use strict';

var bluebird = require('bluebird');

module.exports = function(db, sqs) {
  var Bounce = db.models.Bounce
    , Recipient = db.models.Recipient;

  function receive(queueUrl) {
    return sqs.receiveMessage({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 30
    })
    .promise()
    .then(function(data) {
      if (!data.Messages) {
        return bluebird.resolve([]);
      }

      var messages = data.Messages.map(function(m) { return JSON.parse(JSON.parse(m.Body).Message); })
        , bounces = []
        , recipients = [];

      messages.forEach(function(m) {
        if (m.notificationType === 'Bounce') {
          var bounce = m.bounce;
          bounce.bouncedRecipients.forEach(function(r) {
            recipients.push({
              address: r.emailAddress,
              status: 'bouncing'
            });

            bounces.push({
              id: bounce.feedbackId,
              type: bounce.bounceType,
              subType: bounce.bounceSubType,
              timestamp: bounce.timestamp,
              RecipientAddress: r.emailAddress
            });
          });
        } else if (m.notificationType === 'Delivery') {
          var delivery = m.delivery;
          delivery.recipients.forEach(function(r) {
            recipients.push({
              address: r,
              status: 'deliverable'
            });
          });
        }
      });

      return db.transaction(function(t) {
        return Recipient
        .bulkCreate(recipients, {
          transaction: t,
          updateOnDuplicate: ['status']
        })
        .then(function() {
          return Bounce.bulkCreate(bounces, {
            transaction: t
          });
        });
      })
      .then(function() {
        var entries = data.Messages.map(function(m, i) {
          return {
            Id: i.toString(),
            ReceiptHandle: m.ReceiptHandle
          };
        });

        return sqs.deleteMessageBatch({
          Entries: entries,
          QueueUrl: queueUrl
        }).promise();
      })
      .then(function() {
        return bluebird.resolve([messages, recipients, bounces]);
      });
    });
  }

  return receive;
};
