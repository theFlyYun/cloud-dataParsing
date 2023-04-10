var Promise = require('bluebird');
var _ = require('lodash');
var events = require('events');
var inherits = require('util').inherits;

function Queue() {
  events.EventEmitter.call(this);

  this.isRunning = false;
  this.length = 0;
  this._array = [];
}

inherits(Queue, events.EventEmitter);

Queue.prototype.push = function (data) {
  this._array.push(data);
  this.length = this._array.length;
};

Queue.prototype.shift = function () {
  var data = this._array.shift();
  this.length = this._array.length;
  return data;
};

Queue.prototype.get = function (index) {
  return index !== undefined ? this._array[index] : this._array;
};

module.exports = Queue;
