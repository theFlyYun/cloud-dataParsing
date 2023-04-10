var debug = require('debug')('deviceShadow:dbClient:redis');
var Redis = require('ioredis');
var Promise = require('bluebird');
var uuid = require('uuid/v4');
var events = require('events');
var inherits = require('util').inherits;
var _ = require('lodash');
var moment = require('moment');
var utils = require('../../utils');

/**
 * Create a new dbClient (redis)
 * @class
 */
function DbClient(opts) {
  this.options = opts;

  events.EventEmitter.call(this);//初始化父类

  var buildRedisClient = function (opts) {//建立RedisClient
    return opts.cluster ?
      new Redis.Cluster(opts.options) :  // opts.cluster为true
      new Redis(opts.options[0]);
  };

  const redis = buildRedisClient(this.options);
  redis.on('connect', this.emit.bind(this, 'connect'));//bind预设的初始参数
  redis.client('setname', `${process.pid}.db`);

  this._ioredis = redis;

  /* redis extension */
  redis.hmget2Map = function (key, fields, callback) {//?redis模块添加hmget to map的方法

    if (!utils.isString(key) || !utils.isArray(fields)) {
      throw new Error('hmget2Map: invalid input');
    }

    var op = redis.hmget(key, fields);
    var promiseRes = op.then(function (data) {
      var res = utils.joinArray2Obj(fields, data);
      return new Promise(function (resolve) {
        resolve(res);
      });
    });

    return utils.functionReturn(promiseRes, callback);
  };

  redis.readJSON = function () {
    var key = arguments[0];
    var args = arguments[1];
    var callback = arguments[arguments.length - 1];
    var fields;

    var promiseRes = new Promise(function (resolve, reject) {
      if (!utils.isString(key)) {
        return reject(new Error('readJSON: invalid input'));
      }

      return resolve();
    }).then(function () {
      var op; // a promise

      if (utils.isObject(args) && !utils.isEmptyObject(args)) {
        fields = Object.keys(args);
      }

      if (fields) {
        op = redis.hmget2Map(key, fields);
      } else {
        op = redis.hgetall(key);
      }

      return op;
    }).then(function (data) {
      data = utils.map2Obj(data);

      var res;
      if (fields) {
        res = utils.cloneObj(args);
        utils.updatePropertiesByObjDeeply(res, data);
      } else {
        res = data;
      }

      return new Promise(function (resolve) {
        resolve(res);
      });
    });

    return utils.functionReturn(promiseRes, callback);
  };

  redis.updateJSON = function (key, args, callback) {
    var fields;

    var promiseRes = new Promise(function (resolve, reject) {
      if (!utils.isString(key) || !utils.isObject(args)) {
        return reject(new Error('updateJSON: invalid input'));
      }

      if (!utils.isEmptyObject(args)) {
        fields = Object.keys(args);
      }

      return resolve(null);
    });

    if (fields) {
      promiseRes = promiseRes.then(function () {
        return redis.hmget2Map(key, fields);
      }).then(function (data) {
        data = utils.map2Obj(data);

        debug('updateJSON', `data:`, JSON.stringify(data));
        debug('updateJSON', `args:`, JSON.stringify(args));

        var res = utils.cloneObj(data); // copy original data
        utils.mergeObjDeeply(res, args); // merge data
        var ops = [];

        debug('updateJSON', `merge:`, JSON.stringify(res));

        // for top attributes, we should call hdel
        Object.keys(data).forEach(function (attr) {

          // check whether the original property exists after merge
          // note here, we should check res[attr]
          if (utils.isEmptyValue(res[attr])) {
            ops.push(redis.hdel(key, attr));
          }
        });

        // deep search empty fields in object, and remove it
        res = utils.removeEmptyPropertiesDeeply(res);
        debug('updateJSON', `remove:`, JSON.stringify(res));

        if (!utils.isEmptyValue(res)) {
          res = utils.obj2Map(res);
          ops.push(redis.hmset(key, res));
        }

        return Promise.all(ops);
      });
    }

    return utils.functionReturn(promiseRes, callback);
  };

  /* private functions */
  function tryOperateAttribute(did, operation, args) {

    // operation should be 'readJSON' or 'updateJSON'
    if ((operation !== 'readJSON' && operation !== 'updateJSON') ||
      !utils.isObject(args)) {
      throw new Error('Invalid input');
    }

    return function (key, subKey) {
      var redisKey;
      var subArgs;
      var res; // response a promise or null

      if (key !== 'state' && key !== 'metadata') {
        redisKey = `DeviceShadowDocument_Hash:${did}`;
        subArgs = _.pick(args, [key]);
        if (!utils.isEmptyObject(subArgs)) {
          res = redis[operation](redisKey, subArgs);
        } else {
          res = null;
        }
      } else {
        if (!utils.isObject(args[key]) || !utils.isObject(args[key][subKey])) {
          res = null;
        } else {
          redisKey = `DeviceShadowDocument_Hash:${did}:${key}:${subKey}`;
          subArgs = args[key][subKey];
          res = redis[operation](redisKey, subArgs);
        }
      }

      return res;
    };
  }

  /* public functions */

  // args can have anyOf ['state', 'metadata', 'version']
  // we should calculate metadata, before call this function
  this.updateShadowDocument = function (did, args, callback) {
    args = args || {};
    var error;

    if (!did) {
      error = new Error('invalid input');
    }

    if (!args.state && !args.metadata && !args.version) {
      error = new Error('invalid input');
    }

    if ((args.state && !args.metadata) || (!args.state && args.metadata)) {
      error = new Error('update should have state and metadata');
    }

    if (error) {
      return utils.functionReturn(Promise.reject(error), callback);
    }

    /* update shadow document */
    var ops = [];
    var tryUpdateAttributes = tryOperateAttribute.apply(this, [did, 'updateJSON', args]);
    ops.push(tryUpdateAttributes('version'));
    ops.push(tryUpdateAttributes('state', 'desired'));
    ops.push(tryUpdateAttributes('state', 'reported'));
    ops.push(tryUpdateAttributes('metadata', 'desired'));
    ops.push(tryUpdateAttributes('metadata', 'reported'));

    var promiseRes = Promise.all(ops);
    return utils.functionReturn(promiseRes, callback);
  };

  this.readShadowDocument = function (did, _args, callback) {
    var args = _args;
    callback = arguments[arguments.length - 1];

    var promiseRes = new Promise(function (resolve, reject) {
      if (!did) {
        return reject(new Error('Invalid did'));
      }

      return resolve();
    }).then(function () {
      var ops = [];

      /* read shadow document */
      if (utils.isObject(args) && !utils.isEmptyObject(args)) {
        var tryReadJSON = tryOperateAttribute.apply(this, [did, 'readJSON', args]);
        ops = [
          tryReadJSON('version'),
          tryReadJSON('state', 'desired'),
          tryReadJSON('state', 'reported'),
          tryReadJSON('metadata', 'desired'),
          tryReadJSON('metadata', 'reported'),
        ];
      } else {
        ops = [
          redis.readJSON(`DeviceShadowDocument_Hash:${did}`),
          redis.readJSON(`DeviceShadowDocument_Hash:${did}:state:desired`),
          redis.readJSON(`DeviceShadowDocument_Hash:${did}:state:reported`),
          redis.readJSON(`DeviceShadowDocument_Hash:${did}:metadata:desired`),
          redis.readJSON(`DeviceShadowDocument_Hash:${did}:metadata:reported`),
        ];
      }

      return Promise.all(ops);
    }).then(function (data) {
      if (data.length !== 5) {
        return Promise.reject(new Error('shadow document fragmentary!'));
      }

      debug('readShadowDocument', 'data:', JSON.stringify(data));

      /* build shadow document */

      // FIXME this depends on the call order of commands in ops
      // this should be improved
      var res = {};
      _.assign(res, data[0]);

      if (data[1] || data[2]) {
        if (!res.state) {
          res.state = {};
        }

        if (data[1]) { res.state.desired = data[1]; }

        if (data[2]) { res.state.reported = data[2]; }
      }

      if (data[3] || data[4]) {
        if (!res.metadata) {
          res.metadata = {};
        }

        if (data[3]) { res.metadata.desired = data[3]; }

        if (data[4]) { res.metadata.reported = data[4]; }
      }

      debug('readShadowDocument', 'res:', JSON.stringify(res));
      return Promise.resolve(res);
    });

    return utils.functionReturn(promiseRes, callback);
  };

  function lock(name, timeout, attempts) {
    var count = attempts;
    var identifier = uuid(); // RFC4122

    function run() {
      count--;
      if (count <= 0) {
        return Promise.reject(new Error('Reach max attempts'));
      }

      return redis.setnx(name, identifier).then(function (reply) {
        if (reply) { // reply should be 0/1
          return redis.expire(name, timeout).then(function () {
            // return identifier
            return Promise.resolve(identifier);
          });
        }

        return redis.ttl(name).then(function (reply) {
          if (reply < 0) {
            return redis.expire(name, timeout);
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          return run();
        });
      });
    }

    return run();
  }

  this.acquireShadowLock = function (did, args, callback) {
    var lockname = `DeviceShadowLock_String:${did}`;
    var promiseRes = new Promise(function (resolve, reject) {
      if (!did) {
        return reject(new Error('Invalid did'));
      }

      if (typeof args !== 'object' ||
        !args.timeout ||
        !args.attempts) {
        return reject(new Error('Invalid args'));
      }

      return resolve();
    }).then(function () {
      return lock(lockname, args.timeout, args.attempts);
    });

    return utils.functionReturn(promiseRes, callback);
  };

  function unlock(name, identifier) {
    var pipe = redis.pipeline();

    function run() {
      return pipe.watch(name).get(name).exec().then(function (reply) {
        var db = { identifier: reply[1][1] };
        if (db.identifier === identifier) {
          return redis.multi().del(name).exec().then(function (reply) {
            if (reply) { // transaction success
              return Promise.resolve(true);
            } else { // transaction fail
              return run();
            }
          });
        } else {
          return pipe.unwatch().exec().then(function () {
            return Promise.reject(new Error('Identifier error'));
          });
        }
      });
    }

    return run();
  }

  this.releaseShadowLock = function (did, identifier, callback) {
    var lockname = `DeviceShadowLock_String:${did}`;

    var promiseRes = new Promise(function (resolve, reject) {
      if (!did || !identifier) {
        return reject(new Error('Invalid params'));
      }

      return resolve();
    }).then(function () {
      return unlock(lockname, identifier);
    });

    return utils.functionReturn(promiseRes, callback);
  };

  this.disconnect = function () {
    return redis.disconnect();
  };

  this.readMqttSubscribeByTopic = function (topic) {
    var key = `MqttSubscribe_Set:${topic}`;

    return redis.smembers(key).map(function (location) {
      var tokens = location.split(':');
      return Promise.resolve({ // FIXME should defin cid & mid pattern
        cid: tokens[0],
        mid: tokens[1],
      });
    });
  };
}

inherits(DbClient, events.EventEmitter);

module.exports = DbClient;
