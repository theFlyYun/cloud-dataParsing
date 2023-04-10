var debug = require('debug')('mqttServer:mqClient:kafka:schema');
var Ajv = require('ajv');
var ajv = new Ajv({ allErrors: true, extendRefs: true });
var schema = require('./messages.json'); // FIXME should pass from options
var common = require('./common.json');
ajv.addSchema(common);

var parseParams = function (topic) {
  var params = {};
  var pattern = /\${\w+}/g;
  var found;
  while ((found = pattern.exec(topic)) !== null) {
    var param = found[0].match(/\w+/);
    params[param] = found;
  }

  return params;
};

var replaceParams = function (topic, options) {
  var params = parseParams(topic);
  var res = topic;
  Object.keys(params).forEach(function (param) {
    var match = params[param][0];
    res = res.replace(match, '\\w+'); // FIXME not defined
  });

  debug(`origin: ${topic}, replaced: ${res}`);
  return res;
};

function Schema(options) {
  this.options = options || {};
  this.map = {};

  Object.keys(schema).forEach(function (topicPattern) {
    var topic = replaceParams(topicPattern, options);
    this.map[topic] = {
      schema: schema[topicPattern],
      validate: ajv.compile(schema[topicPattern]),
    };
  }.bind(this));
}

var prototype = Schema.prototype;

prototype.errorsText = function (validate) {
  return ajv.errorsText(validate.errors);
};

prototype.match = function (topic) {
  for (var pattern in this.map) {
    if (topic.match(pattern) !== null) {
      break;
    }
  }

  return this.map[pattern] || null;
};

module.exports = Schema;
