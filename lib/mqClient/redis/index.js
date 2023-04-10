var debug = require('debug')('deviceShadow:mqClient:redis');
var Redis = require('ioredis');
var events = require('events');
var inherits = require('util').inherits;

/**
 * Create a new mqClient (redis)
 * @class
 */
function MqClient(opts) {
  var _this = this;
  this.options = opts;

  var buildRedisClient = function (opts) {
    return opts.cluster ?
      new Redis.Cluster(opts.options) :
      new Redis(opts.options[0]);
  };

  const sub = buildRedisClient(this.options);
  const pub = buildRedisClient(this.options);
  this.state = {
    pub: 'close', // 'close', 'connect'
    sub: 'close',
  };

  /* methods */
  this.subscribe = function (topics, callback) {
    sub.psubscribe(topics, callback);
  };

  this.publish = function (topic, message, callback) {
    if (callback === 'function') {
      return pub.publish(topic, message, callback);
    } else {
      return pub.publish(topic, message);
    }
  };

  this.unsubscribe = function () { }; //TODO

  this.disconnect = function () {
    pub.disconnect();
    sub.disconnect();
  };

  /* events */
  sub.on('pmessage', function (pattern, channel, message) {
    _this.emit('message', channel, message);
  });

  var stateChangeHandler =  function (clientName, event) {
    return function () {
      debug(clientName, event);
      _this.state[clientName] = event;
      if (_this.state.pub === event && _this.state.sub === event) {
        _this.emit(event, _this.state);
      }
    };
  };

  sub.on('connect', stateChangeHandler('sub', 'connect'));
  pub.on('connect', stateChangeHandler('pub', 'connect'));
  sub.on('close', stateChangeHandler('sub', 'close')); // FIXME there may be bugs
  pub.on('close', stateChangeHandler('pub', 'close'));
  sub.on('error', this.emit.bind(this, 'error'));
  pub.on('error', this.emit.bind(this, 'error'));
}

inherits(MqClient, events.EventEmitter);

module.exports = MqClient;
