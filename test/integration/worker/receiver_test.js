'use strict';

var AWS = require('aws-sdk')
  , bluebird = require('bluebird')
  , uuid = require('node-uuid')
  , expect = require('chai').expect
  , Sequelize = require('sequelize')
  , defineModels = require('../../../common/models')
  , createReceiver = require('../../../worker/receiver');

function getQueue(sqs) {
  var dispose;

  return sqs.createQueue({
    QueueName: uuid.v4()
  })
  .promise()
  .then(function(data) {
    dispose = function() {
      return sqs.deleteQueue({
        QueueUrl: data.QueueUrl
      }).promise();
    };

    return bluebird.resolve(data.QueueUrl);
  })
  .disposer(function() {
    if (dispose) {
      return dispose();
    }
  });
}

describe('worker/receiver', function() {
  it('adds bounces', function() {
    var db = new Sequelize(process.env.DATABASE_URL)
      , sqs = new AWS.SQS();

    this.timeout(5000);

    AWS.config.setPromisesDependency(bluebird);
    defineModels(db);
    return db.sync({force: true})
    .then(function() {
      var Recipient = db.models.Recipient
        , Bounce = db.models.Bounce
        , receive = createReceiver(db, sqs);

      return bluebird
      .using(getQueue(sqs), function(queueUrl) {
        return sqs.sendMessage({
          MessageBody: '{"Message": "{\\"notificationType\\":\\"Bounce\\",\\"bounce\\":{\\"bounceType\\":\\"Permanent\\",\\"bounceSubType\\":\\"General\\",\\"bouncedRecipients\\":[{\\"emailAddress\\":\\"bounce@simulator.amazonses.com\\",\\"action\\":\\"failed\\",\\"status\\":\\"5.1.1\\",\\"diagnosticCode\\":\\"smtp; 550 5.1.1 user unknown\\"}],\\"timestamp\\":\\"2016-05-17T09:55:08.668Z\\",\\"feedbackId\\":\\"000001378603176d-5a4b5ad9-6f30-4198-a8c3-b1eb0c270a1d-000000\\",\\"reportingMTA\\":\\"dsn; a8-85.smtp-out.amazonses.com\\"},\\"mail\\":{\\"timestamp\\":\\"2016-05-17T09:55:08.000Z\\",\\"source\\":\\"foo@example.com\\",\\"sourceArn\\":\\"arn:aws:ses:us-east-1:123456789012:identity/example.com\\",\\"sendingAccountId\\":\\"123456789012\\",\\"messageId\\":\\"000001271b15238a-fd3ae762-2563-11df-8cd4-6d4e828a9ae8-000000\\",\\"destination\\":[\\"bounce@simulator.amazonses.com\\"]}}"}',
          QueueUrl: queueUrl
        })
        .promise()
        .then(function() {
          return receive(queueUrl);
        })
        .then(function() {
          return Recipient.findAll({
            include: [Bounce]
          })
          .then(function(recipients) {
            var r = recipients[0]
              , b;
            expect(recipients.length).to.eql(1);
            expect(r.address).to.eql('bounce@simulator.amazonses.com');
            expect(r.status).to.eql('bouncing');
            expect(r.Bounces.length).to.eql(1);

            b = r.Bounces[0];
            expect(b.id).to.eql('000001378603176d-5a4b5ad9-6f30-4198-a8c3-b1eb0c270a1d-000000');
            expect(b.type).to.eql('Permanent');
            expect(b.subType).to.eql('General');
            expect(b.timestamp).to.eql(new Date('2016-05-17T09:55:08.000Z'));
          });
        });
      });
    });
  });

  it('marks as deliverable', function() {
    var db = new Sequelize(process.env.DATABASE_URL)
      , sqs = new AWS.SQS();

    this.timeout(5000);

    AWS.config.setPromisesDependency(bluebird);
    defineModels(db);
    return db.sync({force: true})
    .then(function() {
      var Recipient = db.models.Recipient;

      return Recipient.create({
        address: 'success@simulator.amazonses.com',
        status: 'bouncing'
      });
    })
    .then(function() {
      var Recipient = db.models.Recipient
        , receive = createReceiver(db, sqs);

      return bluebird
      .using(getQueue(sqs), function(queueUrl) {
        return sqs.sendMessage({
          MessageBody: '{"Message": "{\\"notificationType\\":\\"Delivery\\",\\"mail\\":{\\"timestamp\\":\\"2016-05-17T10:51:47.001Z\\",\\"source\\":\\"foo@example.com\\",\\"sourceArn\\":\\"arn:aws:ses:us-east-1:123456789012:identity/example.com\\",\\"sendingAccountId\\":\\"123456789012\\",\\"messageId\\":\\"000001271b15238a-fd3ae762-2563-11df-9cd4-6d4e828a9ae8-000000\\",\\"destination\\":[\\"success@simulator.amazonses.com\\"]},\\"delivery\\":{\\"timestamp\\":\\"2016-05-17T10:51:47.446Z\\",\\"processingTimeMillis\\":445,\\"recipients\\":[\\"success@simulator.amazonses.com\\"],\\"smtpResponse\\":\\"250 2.6.0 Message received\\",\\"reportingMTA\\":\\"a8-50.smtp-out.amazonses.com\\"}}"}',
          QueueUrl: queueUrl
        })
        .promise()
        .then(function() {
          return receive(queueUrl);
        })
        .then(function() {
          return Recipient.findAll()
          .then(function(recipients) {
            var r = recipients[0];
            expect(r.status).to.eql('deliverable');
          });
        });
      });
    });
  });
});
