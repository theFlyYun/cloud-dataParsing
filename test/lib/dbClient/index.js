var assert = require('assert');
var Promise = require('bluebird');
var expect = require('chai').expect;
var DbClient = require('../../../lib/dbClient');
var Redis = require('ioredis');

describe('# DbClient', function () {
  var config = {
    cluster: false,
    options: [{ host: 'localhost', port: '6379' }],
  };
  var dbClient = new DbClient(config);
  var redis = new Redis(config.options[0]);

  var did = 'foo';
  var args = {
    timeout: 10,
    attempts: 10,
  };

  var lockname = `DeviceShadowLock_String:${did}`;
  afterEach(function (done) {
    //console.log('Calling afterEach: clean lock');
    redis.del(lockname).then(function () {
      done();
    });
  });

  describe('- acquireShadowLock(did)', function () {
    it('should return error unless did & args present', function (done) {
      Promise.all([
        dbClient.acquireShadowLock(undefined).catch(Promise.resolve),
        dbClient.acquireShadowLock('foo').catch(Promise.resolve),
        dbClient.acquireShadowLock('foo', {}).catch(Promise.resolve),
      ]).then(function (reply) {
        reply.forEach(function (err) {
          expect(err).to.be.an.instanceof(Error);
        });

        done();
      });
    });

    it('should acquire lock when lock is free', function (done) {
      dbClient.acquireShadowLock(did, args).then(function (reply) {
        expect(reply).to.be.a('string');
        done();
      });
    });

    it('should not acquire lock when lock is occupied', function (done) {
      Promise.all([
        dbClient.acquireShadowLock(did, args),
        dbClient.acquireShadowLock(did, args),
        dbClient.acquireShadowLock(did, args),
        dbClient.acquireShadowLock(did, args),
      ]).catch(function (err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });

    it('should update ttl when lock is not expired', function (done) {
      redis.set(lockname, 'bar').then(function () {
        return dbClient.acquireShadowLock(did, args);
      }).catch(function (err) {
        expect(err).to.be.an.instanceof(Error);
        return redis.ttl(lockname);
      }).then(function (reply) {
        expect(reply).to.be.above(0);
        done();
      });
    });
  });

  describe('- releaseShadowLock(did)', function () {
    var identifier;
    beforeEach(function (done) {
      //console.log('Calling beforeEach: acquire lock');
      dbClient.acquireShadowLock(did, args).then(function (reply) {
        identifier = reply;
        done();
      });
    });

    it('should return error unless did & identifier present', function (done) {
      Promise.all([
        dbClient.releaseShadowLock(undefined).catch(Promise.resolve),
        dbClient.releaseShadowLock(lockname).catch(Promise.resolve),
      ]).then(function (reply) {
        reply.forEach(function (err) {
          expect(err).to.be.an.instanceof(Error);
        });

        done();
      });
    });

    it('should release lock when identifier is right', function (done) {
      dbClient.releaseShadowLock(did, identifier).then(function (reply) {
        expect(reply).to.be.eql(true);
        done();
      });
    });

    it('should not release lock when lock change (e.g. timeout)', function (done) {
      var op = dbClient.releaseShadowLock(did, identifier);
      redis.del(lockname); // FIXME this is not easy to test the race condition
      op.catch(function (err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });

    it('should not release lock when identifier is wrong', function (done) {
      dbClient.releaseShadowLock(did, 'bar').catch(function (err) {
        expect(err).to.be.an.instanceof(Error);
        done();
      });
    });
  });

});
