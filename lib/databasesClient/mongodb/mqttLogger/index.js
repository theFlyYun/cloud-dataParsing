var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var events = require('events');
var inherits = require('util').inherits;
var rawSchema = require('./schema');

function MongoMqttLogger(options) { // FIXME wrapper only for mqttLogger db
  this.options = options || {};

  /* connect to mongod */
  var uri = `mongodb://${options.host}:${options.port}/${options.db}`;
  mongoose.connect(uri, { useMongoClient: true });
  var db = this.db = mongoose.connection;

  /* compile schema */
  this.schema = new mongoose.Schema(rawSchema); // all collections use the same schema

  /* events  */
  db.on('open',  this.emit.bind(this, 'open'));
  db.on('error', this.emit.bind(this, 'error'));
  db.on('close', this.emit.bind(this, 'close'));

  events.EventEmitter.call(this);
}

inherits(MongoMqttLogger, events.EventEmitter);

var prototype = MongoMqttLogger.prototype;

prototype.getModel = function (product_key) {
  var collectionName = `productKey:${product_key}`;
  try {
    return mongoose.model(collectionName);
  } catch (ex) {
    return mongoose.model(collectionName, this.schema, collectionName);
  }
};

prototype.save = function (product_key, data) {
  var M = this.getModel(product_key);
  var m = new M(data);
  return m.save();
};

prototype.close = function () {
  return this.db.close();
};

module.exports = MongoMqttLogger;
