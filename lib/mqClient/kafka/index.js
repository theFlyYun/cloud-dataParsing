var debug = require('debug')('deviceShadow:mqClient:kafka');
var events = require('events');
var Promise = require('bluebird');
var _ = require('lodash');
var kafka = require('kafka-node');
var Schema = require('./schema');
var ConsumerGroup = kafka.ConsumerGroup;
var HighLevelProducer = kafka.HighLevelProducer;
var inherits = require('util').inherits;
var appMonitorHelper = require('../../AppMonitorHelper').getInstance();

/**
 * Create a new mqClient (kafka)
 * @class
 */
function MqClient(opts) {
  var _this = this;
  this.options = {};
  _.defaults(this.options, opts);

  debug('kafka options: %j', this.options);

  this._consumerGroup = new ConsumerGroup(
    this.options.consumerGroup.options,
    this.options.consumerGroup.topics
  );

  var client = new kafka.Client(this.options.producer.host, this.options.producer.clientId);
  this._producer = new HighLevelProducer(client, this.options.producer.options);

  // bind events
  var onConnect = function () {
    if (this._producer.ready && this._consumerGroup.ready) {
      this.emit('connect');
      this.emit('ready');
    }
  };

  var onMessage = function (res) {
    this.emit('message', res);

    var res2 = _.assign({}, res);
    appMonitorHelper.onKafkaMessageReceive(res2);
    try {
      res2.value = JSON.parse(res2.value);
      this.emit('messageParseValue', res2);
    } catch (ex) {

      // FIXME do nothing here
      //console.log(ex);
    }
  };

  //this._consumerGroup.on('ready', function () {}); // do not handle this
  this._producer.on('ready', onConnect.bind(this));
  this._consumerGroup.on('connect', onConnect.bind(this));
  this._consumerGroup.on('message', onMessage.bind(this));

  ['error'].forEach(function (event) {
    this._producer.on(event, this.emit.bind(this, event));
  }.bind(this));

  [
    'error',
    'offsetOutOfRange',
  ].forEach(function (event) {
    this._consumerGroup.on(event, this.emit.bind(this, event));
  }.bind(this));

  /* load message schema */
  if (debug.enabled) {
    this.msgSchema = new Schema();
    debug('kafka schema: %j', Object.keys(this.msgSchema.map));
  }

  events.EventEmitter.call(this);
}

inherits(MqClient, events.EventEmitter);

var prototype = MqClient.prototype;

prototype.send = function (payloads) {
  var producer = this._producer;
  var callback = arguments[arguments.length - 1];
  var op = Promise.map(payloads, function (item) {
    // item should be object with key: 'messages', 'topic'
    var error;
    switch (typeof item.messages) {
      case 'string':
        break;
      case 'object':
        item.messages = JSON.stringify(item.messages);
        break;
      default:
        error = new Error('Invalid message type. should be string or object');
        break;
    }

    if (typeof item.topic !== 'string') {
      error = new Error('Invalid topic');
    }

    if (error) {
      return Promise.reject(error);
    } else {
      debug(`kafka send message to topic: ${item.topic}`);
      return Promise.resolve(item);
    }
  }).then(function (payloads) {
    return new Promise(function (resolve, reject) {
      producer.send(payloads, function (err, data) {
        if (err) { return reject(err); }

        appMonitorHelper.onKafkaReqsSent(payloads);
        return resolve(data);
      });
    });
  });

  if (typeof callback === 'function') {
    op.then(function (data) {
      return callback(null, data);
    }).catch(callback);
  } else {
    return op;
  }
};

prototype.publish = function (topic, message) {
  if (debug.enabled) {
    var validate = this.msgSchema.match(topic).validate;
    var valid = validate(message);
    debug(`validate message of topic: ${topic} ${valid ? 'pass' : 'fail'}`);

    if (!valid) {
      return Promise.reject(new Error(
        topic + ' ' +
        this.msgSchema.errorsText(validate)
      ));
    }
  }

  return this.send([{ topic: topic, messages: message }]);
};

prototype.getSubTopics = function () {
  return this._consumerGroup.topics;
};

prototype.disconnect = function () {
  var close = function (client) {
    return new Promise(function (resolve, reject) {
      client.close(function (err) {
        if (err) { return reject(err); }

        return resolve();
      });
    });
  };

  return Promise.all([
    close(this._producer),
    close(this._consumerGroup),
  ]);
};

var checkInput = function (argsObj) {
  var args = Array.from(argsObj);
  return new Promise(function (resolve, reject) {
    var rc = args.every(function (item) {
      return item !== undefined;
    });

    if (!rc) {
      return reject(new Error('Invalid input'));
    } else {
      return resolve();
    }
  });
};

prototype.replyMqttPublish2Dispatch = function (mqttTopic, mqttPayload, params) {
  var _this = this;

  return checkInput(arguments).then(function () {
    if (params.cid === undefined || params.mid === undefined) {
      return Promise.reject('Invalid params');
    }

    var topic = params.isInternal ? `mqtt-sub-${params.cid}` : 'mqtt-out';
    delete params.isInternal;

    var message = _.assign({
      op: 'sub',
      cid: null,
      mid: 'emptyValue', // FIXME empty value
      did: null,
      topic: (typeof mqttTopic === 'object') ? mqttTopic.raw : mqttTopic,
      payload: Buffer.isBuffer(mqttPayload) ? mqttPayload.toString() : mqttPayload,
    }, params);

    return _this.publish(topic, message);
  });
};

prototype.replyHttpPublish = function (mqttTopic, mqttPayload, params) {
  var _this = this;

  return checkInput(arguments).then(function () {
    if (params.cid === undefined || params.httpid === undefined) {
      return Promise.reject('Invalid params');
    }

    var topic = params.isInternal ?
      `http-sub-${params.cid}-${params.httpid}` :
      'http-out';
    delete params.isInternal;

    var message = _.assign({
      reqMsgId: null,
      op: 'sub',
      cid: null,
      httpid: null,
      did: null,
      topic: (typeof mqttTopic === 'object') ? mqttTopic.raw : mqttTopic,
      payload: Buffer.isBuffer(mqttPayload) ? mqttPayload.toString() : mqttPayload,
    }, params);

    return _this.publish(topic, message);
  });
};

module.exports = MqClient;
