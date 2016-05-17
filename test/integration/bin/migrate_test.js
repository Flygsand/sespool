'use strict';

var spawn = require('child_process').spawnSync
  , parseUrl = require('url').parse
  , expect = require('chai').expect
  , Sequelize = require('sequelize');

function databaseName(url) {
  return parseUrl(url).pathname.substring(1);
}

describe('bin/migrate', function() {
  it('runs migrations successfully and then the supplied command', function() {
    var db = new Sequelize(process.env.DATABASE_URL)
      , dbName = databaseName(process.env.DATABASE_URL)
      , migrate;

    return db.query('DROP DATABASE ' + dbName)
    .then(function() {
      return db.query('CREATE DATABASE ' + dbName);
    })
    .then(function() {
      migrate = spawn('./bin/migrate', ['sh', '-c', 'echo foo']);

      expect(migrate.stdout.toString()).to.eql('foo\n');
      expect(migrate.stderr.toString()).to.eql('Liquibase Update Successful\n');
    });
  });
});
