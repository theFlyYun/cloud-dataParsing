var Promise = require('bluebird');
var expect = require('chai').expect;
var Queue = require('../../../lib/queue');

describe('#Queue', function () {

  it('should start empty', function () {
    var queue = new Queue();
    expect(queue.length).to.be.eql(0);
  });

  it('should start not running', function () {
    var queue = new Queue();
    expect(queue.isRunning).to.be.eql(false);
  });

  it('should inherit from event emitter', function (done) {
    var queue = new Queue();
    queue.on('foo', done);
    queue.emit('foo');
  });

  describe('- push(data)', function () {
    it('should push data into queue', function () {
      var queue = new Queue();
      queue.push();
      expect(queue.length).to.be.eql(1);
      queue.push('foo');
      expect(queue.length).to.be.eql(2);
    });
  });

  describe('- shift()', function () {
    it('should shift \'undefined\' from queue when queue is empty', function () {
      var queue = new Queue();
      var data = queue.shift();
      expect(queue.length).to.be.eql(0);
      expect(data).to.be.eql(undefined);
    });

    it('should shift first data from queue when queue is not empty', function () {
      var queue = new Queue();
      var d1 = 'foo';
      var d2 = 'bar';

      queue.push(d1);
      queue.push(d2);
      var data = queue.shift();

      expect(data).to.be.eql(d1);
      expect(queue.length).to.be.eql(1);
    });
  });

  describe('- get(index)', function () {
    it('should get all data from queue when index not present', function () {
      var queue = new Queue();
      var d1 = 'foo';
      var d2 = 'bar';

      queue.push(d1);
      queue.push(d2);

      var data = queue.get();
      expect(data).to.be.an('array').and.to.eql([d1, d2]);
    });

    it('should get the data from queue when index present', function () {
      var queue = new Queue();
      var d1 = 'foo';
      var d2 = 'bar';

      queue.push(d1);
      queue.push(d2);

      expect(queue.get(0)).to.be.eql(d1);
      expect(queue.get(1)).to.be.eql(d2);
      expect(queue.get({})).to.be.eql(undefined);
      expect(queue.get('foo')).to.be.eql(undefined);
    });
  });
});
