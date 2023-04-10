var debug = require('debug')('deviceShadow:controller');
var _ = require('lodash');
var moment = require('moment');
var callWatcherHelper = require('../CallWatcherHelper').getInstance();
var utils = callWatcherHelper.createWatchCallsObject('utils', require('../utils'));
var Error = require('../error');

// for now it is just an object
var _this = {};

// convert topic 'string' to 'array'
// caller should catch the error
_this.tryParseTopic = function (topic, _direction) {

  var direction = _direction || 'subscribe';
  var rc = false;

  if (!topic || typeof topic !== 'string') {
    throw new Error('Invalid topic');
  }

  // parse topic
  var res = {};
  res.raw = topic;
  res.tokens = topic.split('/');
  res.did = res.tokens[2];
  res.operation = res.tokens[4];
  res.status = res.tokens[5];
  res.toString = function () { return res.raw; };

  // check topic
  if (res.tokens[0] === '$rlwio') {

    //
    // Device shadow topics have the form:
    //
    //   $rlwio/devices/{did}/shadow/{Operation}/{Status}
    //
    // Where {Operation} === update|get
    //   And    {Status} === accepted|rejected|delta
    //
    if ((res.tokens[1] === 'devices') &&
      (res.tokens[3] === 'shadow') &&
      ((res.operation === 'update') ||
        (res.operation === 'get'))) {

      //
      // Looks good so far; now check the direction and see if
      // still makes sense.
      //
      if (direction === 'publish') {
        if (((res.status === 'accepted') ||
          (res.status === 'rejected') ||
          (res.status === 'delta')) &&
          (res.tokens.length === 6)) {
          rc = true;
        }
      } else { // direction === 'subscribe'
        if (res.tokens.length === 5) {
          rc = true;
        }
      }
    }
  }

  if (!rc) {
    throw new Error('Invalid topic');
  }

  return res;
};

var rebuildKeyPathToObj = function (keyPaths) {
  if (keyPaths.length < 1) {
    throw new Error('rebuildKeyPathToObj: args is empty');
  }
  var sourceObj = { 'state': {} };
  //存储临时的子对象
  var currentSubObj = {};

  keyPaths.forEach(function (key) {
    if (!_.isString(key)) {
      return;
    }

    var subPropertyArr = key.split('.');

    if (!subPropertyArr || subPropertyArr.length < 2) {
      throw new Error('rebuildKeyPathToObj: args should have state & reported/desired');
    }
    if (subPropertyArr[0] !== 'state') {
      throw new Error('rebuildKeyPathToObj: args should have state');
    }
    if (['desired', 'reported'].indexOf(subPropertyArr[1]) < 0) {
      throw new Error('rebuildKeyPathToObj: invalid args');
    }

    var length = subPropertyArr.length;
    // state.desired 这种情况下直接赋值 因为只需要key所以value随便使用了’e‘
    if (length === 2) {
      if (!sourceObj.state[subPropertyArr[1]]) {
        Object.assign(sourceObj.state, { [subPropertyArr[1]]: {} });
      }
      return;
    }

    currentSubObj = sourceObj.state;

    //从state 后面的节点开始处理
    for (var i = 1; i <= length - 1; i++) {

      var currentSubProperty = subPropertyArr[i];

      if (i === length - 1) {
        //叶子的话直接赋值
        currentSubObj[currentSubProperty] = 'e';
      } else {
        if (!hasOwnProperty.call(currentSubObj, currentSubProperty)) {
          currentSubObj[currentSubProperty] = {};
        }
        //继续找下一个相连的结点
        currentSubObj = currentSubObj[currentSubProperty];
      }
    } //for loop end
  });

  sourceObj.version = 0;
  return sourceObj;
};

_this.tryParseMqttGetPayload = function (payload) {
  if (!payload) {
    return {};
  }
  var error = function (msg) {
    return new Error({ code: 400, message: msg });
  };
  try {
    payload = JSON.parse(payload);
  } catch (ex) {
    throw error('Invalid JSON');
  }

  if (utils.isObject(payload)) {
    // check state
    if (!payload.state) {
      throw error('Missing required node: state');
    }
    // check state
    if (!utils.isObject(payload.state)) {
      throw error('State node must be an object');
    }

    // check desired
    if (('desired' in payload.state) && !utils.isObject(payload.state.desired)) {
      payload.state.desired = {};
    }

    // check reported
    if (('reported' in payload.state) && !utils.isObject(payload.state.reported)) {
      payload.state.reported = {};
    }

    var nodes = Object.keys(payload.state);
    var rc = nodes.every(function (node) {
      if (['reported', 'desired'].indexOf(node) < 0) {
        return false;
      }

      return true;
    });

    if (nodes.length <= 0 || !rc) {
      throw error('State contains an invalid node');
    }
    // add version and timestap
    payload.version = 0;
    return payload;
  }
  if (utils.isString(payload)) {
    return payload === '' ? {} : rebuildKeyPathToObj([payload]);
  }

  if (utils.isArray(payload)) {
    return utils.isEmptyArray(payload) ? {} : rebuildKeyPathToObj(payload);
  }
};

// convert payload 'string' to 'object'
// caller should catch the error
_this.tryParseMqttUpdatePayload = function (payload, _direction) {

  var direction = _direction || 'subscribe';
  var error = function (msg) {
    return new Error({ code: 400, message: msg });
  };

  try {
    payload = JSON.parse(payload);
  } catch (ex) {
    throw error('Invalid JSON');
  }

  // check state
  if (!payload.state) {
    throw error('Missing required node: state');
  }

  // check state
  if (!utils.isObject(payload.state)) {
    throw error('State node must be an object');
  } else {

    // check desired
    if (('desired' in payload.state) && !utils.isObject(payload.state.desired)) {
      throw error('Desired node must be an object');
    }

    // check reported
    if (('reported' in payload.state) && !utils.isObject(payload.state.reported)) {
      throw error('Reported node must be an object');
    }

    var nodes = Object.keys(payload.state);
    var rc = nodes.every(function (node) {
      if (['reported', 'desired'].indexOf(node) < 0) {
        return false;
      }

      return true;
    });

    if (nodes.length <= 0 || !rc) {
      throw error('State contains an invalid node');
    }
  }

  // check version
  if (payload.version && (isNaN(payload.version) || payload.version < 0)) {
    throw error('Invalid version');
  }

  // check clientToken
  if (payload.clientToken && null) { //FIXME not defined
    throw error('Invalid clientToken');
  }

  //FIXME check payload depth
  if (null) {
    throw error('JSON contains too many levels of nesting; maximum is 6');
  }

  return payload;
};

_this.generateMetadata = function (obj, value) {

  if (!utils.isObject(obj.state)) {
    throw new Error('Invalid obj. obj.state not exists');
  }

  obj.metadata = utils.cloneObj(obj.state);

  if (value) {
    utils.updatePropertiesByValueDeeply(obj.metadata, value);
  }

  return obj;
};

_this.generateDelta = function (obj) {

  if (!utils.isObject(obj.state) ||
    !utils.isObject(obj.state.reported) ||
    !utils.isObject(obj.state.desired) ||
    !utils.isObject(obj.metadata) ||
    !utils.isObject(obj.metadata.reported) ||
    !utils.isObject(obj.metadata.desired)) {

    throw new Error('Invalid obj. obj should have state & metadata');
  }

  obj.state.delta = utils.cloneObj(obj.state.desired);
  utils.pickDiffPropertiesDeeply(obj.state.delta, obj.state.reported);

  obj.metadata.delta = utils.cloneObj(obj.state.delta);
  utils.updatePropertiesByObjDeeply(obj.metadata.delta, obj.metadata.desired);

  return obj;
};

_this.prepareReadArgs = function (obj) {

  if (!utils.isObject(obj.state)) {
    throw new Error('Invalid obj. obj.state not exists');
  }

  // generate state.desired & state.reported tree
  if (utils.isObject(obj.state.desired)) {
    if (utils.isObject(obj.state.reported)) {
      utils.mergeObjDeeply(obj.state.desired, obj.state.reported);
      obj.state.reported = utils.cloneObj(obj.state.desired);
    } else {
      obj.state.reported = utils.cloneObj(obj.state.desired);
    }
  } else {
    if (utils.isObject(obj.state.reported)) {
      obj.state.desired = utils.cloneObj(obj.state.reported);
    } else {
      throw new Error('Invalid obj. this should never happen, when after validator');
    }
  }

  // generate metadata.desired & metadata.reported tree
  _this.generateMetadata(obj);

  return obj;
};

_this.removeNullAttributes = function (obj) {

  if (!utils.isObject(obj) ||
    !utils.isObject(obj.state) ||
    !utils.isObject(obj.metadata)) {
    throw new Error('Invalid obj. obj.state not exists');
  }

  var tryRemove = function (value) {
    if (utils.isObject(value)) {
      utils.removeEmptyPropertiesDeeply(value);
    }
  };

  tryRemove(obj.state.reported);
  tryRemove(obj.state.desired);
  tryRemove(obj.metadata.reported);
  tryRemove(obj.metadata.desired);

  return obj;
};

_this.buildTopic = function (did, operation, status) {
  if (['update', 'get'].indexOf(operation) < 0 ||
    (status && ['accepted', 'rejected', 'delta'].indexOf(status) < 0)) {
    throw new Error('Invalid params for build topic');
  }

  if (status) {
    return '$rlwio/devices/' + did + '/shadow/' + operation + '/' + status;
  }

  return '$rlwio/devices/' + did + '/shadow/' + operation;
};

_this.buildPayload = function (payload, version, clientToken, timestamp) {

  // payload.metadata & payload.delta should be prepared before
  var res = utils.cloneObj(payload); // return a new object

  if (version) {
    if (res.version) { // change the order
      delete res.version;
    }

    res.version = version;
  }

  if (clientToken) {
    res.clientToken = clientToken;
  }

  if (timestamp) {
    res.timestamp = timestamp;
  }

  return JSON.stringify(res);
};

_this.aggregateRequests = function (reqs) {
  // reqs should be array, and each item should be request

  var res = []; // save aggregated requsts
  var appUpdateRequest; // save aggregated app update request
  var devUpdateRequest; // save aggregated dev update request
  var lastUpdateFlag; // flag should be 'app' or 'dev'

  //var debug = function (msg) {
  //  console.log('+', msg);
  //  console.log('  - appUpdateRequest: ', JSON.stringify(appUpdateRequest));
  //  console.log('  - devUpdateRequest: ', JSON.stringify(devUpdateRequest));
  //  console.log('  - res: ', res.length, JSON.stringify(res));
  //};

  var aggregate = function (des, src) {
    if (!des) {
      des = src;
    } else {
      utils.mergeObjDeeply(des.payload, src.payload);
      des.timestamp = src.timestamp;
      des.aggregation++; // increase counter
    }

    return des;
  };

  var save = function (res, items) {
    items = Array.isArray(items) ? items : [items];
    items.forEach(function (item) {
      if (item) { res.push(item); }
    });
  };

  reqs.forEach(function (req, i) {
    //debug(`${i} in`);

    if (req.topic.operation === 'get') {

      // save update first
      if (lastUpdateFlag) {
        if (lastUpdateFlag === 'app') {
          save(res, [devUpdateRequest, appUpdateRequest]);
        } else { // dev
          save(res, [appUpdateRequest, devUpdateRequest]);
        }
      }

      // save get first
      res.push(req);

      // clear state
      appUpdateRequest = null;
      devUpdateRequest = null;
      lastUpdateFlag = null;
    } else { // update
      let from = req.raw.value.from;
      if (from.uid) {
        appUpdateRequest = aggregate(appUpdateRequest, req);
        lastUpdateFlag = 'app';
      } else {
        devUpdateRequest = aggregate(devUpdateRequest, req);
        lastUpdateFlag = 'dev';
      }
    }

    //debug(`${i} done`);
  });

  // save update
  if (lastUpdateFlag) {
    if (lastUpdateFlag === 'app') {
      save(res, [devUpdateRequest, appUpdateRequest]);
    } else { // dev
      save(res, [appUpdateRequest, devUpdateRequest]);
    }
  }

  //debug(`final done`);
  return res;
};

module.exports = _this;
