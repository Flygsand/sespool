'use strict';

var winston = require('winston');

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return new Date();
      },
      formatter: require('winston-jsonevent')
    })
  ]
});
