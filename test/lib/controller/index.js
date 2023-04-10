var assert = require('assert');
var Promise = require('bluebird');
var expect = require('chai').expect;
var controller = require('lib/controller');
var utils = require('lib/utils');

describe('#controllers', function () {

  describe('- tryParseTopic', function () {
    var tryParseTopic = controller.tryParseTopic;

    it('should not parse the wrong topic', function () {
      var topics = [
        '$rlwi/devices/did/shadow/update',
        '$rlwio/device/did/shadow/update',
        '$rlwio/devices/did/shado/update',
        '$rlwio/devices/did/shadow/foo',
        null,
      ];

      topics.forEach(function (topic) {
        expect(tryParseTopic.bind(null, topic)).to.throw(Error);
      });
    });

    it('should parse topic to an object', function () {
      var subTopics = [
        '$rlwio/devices/did/shadow/update',
        '$rlwio/devices/did/shadow/get',
      ];

      var pubTopics = [
        '$rlwio/devices/did/shadow/update/accepted',
        '$rlwio/devices/did/shadow/update/rejected',
        '$rlwio/devices/did/shadow/update/delta',
        '$rlwio/devices/did/shadow/get/accepted',
        '$rlwio/devices/did/shadow/get/rejected',
      ];

      subTopics.forEach(function (topic) {
        var res = tryParseTopic(topic);
        expect(res).to.be.an('object');
        expect(res).to.have.property('raw').and.to.be.a('string');
        expect(res).to.have.property('tokens').and.to.be.an('array');
        expect(res).to.have.property('did').and.to.be.a('string');
        expect(res).to.have.property('operation').and.to.be.oneOf(['update', 'get']);
        expect('' + res).to.be.eql(res.raw);
      });

      pubTopics.forEach(function (topic) {
        var res = tryParseTopic(topic, 'publish');
        expect(res).to.be.an('object');
        expect(res).to.have.property('raw').and.to.be.a('string');
        expect(res).to.have.property('tokens').and.to.be.an('array');
        expect(res).to.have.property('did').and.to.be.a('string');
        expect(res).to.have.property('operation').and.to.be.oneOf(['update', 'get']);
        expect(res).to.have.property('status').and.to.be.oneOf([
          'accepted',
          'rejected',
          'delta',
        ]);
        expect('' + res).to.be.eql(res.raw);
      });

    });
  });

  describe('- aggregateRequests', function () {
    var aggregateRequests = controller.aggregateRequests;

    it('should work without error when only update requests in array', function () {
      var reqs = [];
      var halfLength = 2;
      for (let i = 0; i < halfLength; i++) {
        var payload = {};
        payload[`foo${i}`] = `bar${i}`;

        reqs.push({
          raw: { value: { from: { uid: 'U1' } } },
          error: null,
          topic: {},
          payload: utils.cloneObj(payload),
          timestamp: null,
          response: [],
        });
        reqs.push({
          raw: { value: { from: { did: 'D1' } } },
          error: null,
          topic: {},
          payload: utils.cloneObj(payload),
          timestamp: null,
          response: [],
        });
      }

      var res = aggregateRequests(reqs);
      expect(res).to.be.an('array').with.length(2); // app, dev
      expect(reqs).to.be.an('array').with.length(halfLength * 2);
    });

    it('should work without error when get/update requests in array', function () {
      var reqs = [];
      var halfLength = 10;
      var skip = 5;
      for (let i = 0; i < halfLength; i++) {
        var payload = {};
        payload[`foo${i}`] = `bar${i}`;

        if (i % skip === 0) {
          reqs.push({
            raw: { value: { from: { uid: 'U1' } } },
            error: null,
            topic: { operation: 'get' },
            payload: utils.cloneObj(payload),
            timestamp: null,
            response: [],
          });
        }

        reqs.push({
          raw: { value: { from: { uid: 'U1' } } },
          error: null,
          topic: { operation: 'update' },
          payload: utils.cloneObj(payload),
          timestamp: null,
          response: [],
        });
        reqs.push({
          raw: { value: { from: { did: 'D1' } } },
          error: null,
          topic: { operation: 'update' },
          payload: utils.cloneObj(payload),
          timestamp: null,
          response: [],
        });
      }

      var res = aggregateRequests(reqs);
      var nSkip = Math.floor(halfLength / skip);
      expect(reqs).to.be.an('array').with.length(nSkip + halfLength * 2);
      expect(res).to.be.an('array').with.length(nSkip + nSkip * 2);
    });
  });
});
