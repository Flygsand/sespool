'use strict';

var Sequelize = require('sequelize');

module.exports = function(db) {
  var opts = {
        timestamps: false
      }
    , Bounce = db.define('Bounce', {
      id: {
        type: Sequelize.STRING() + ' CHARSET ascii COLLATE ascii_general_ci',
        primaryKey: true
      },
      type: Sequelize.STRING,
      subType: Sequelize.STRING,
      timestamp: Sequelize.DATE
    }, opts)
    , Recipient = db.define('Recipient', {
        address: {
          type: Sequelize.STRING() + ' CHARSET utf8 COLLATE utf8_general_ci',
          primaryKey: true
        },
        status: Sequelize.ENUM('bouncing', 'deliverable')
      }, opts);

  Bounce.belongsTo(Recipient);
  Recipient.hasMany(Bounce);

  return {
    Bounce: Bounce,
    Recipient: Recipient
  };
};
