var debug = require('debug')('deviceShadow:utils');
var _ = require('lodash');

var _this = {
  isEmptyValue: function (value) {

    // 0, false is valid value in a shadow document
    return (value === null || value === undefined || _this.isEmptyObject(value));
  },

  isString: function (value) {
    return typeof value === 'string';
  },

  isObject: function (value) {
    return (value !== null && !Array.isArray(value) && typeof value === 'object');
  },

  isEmptyObject: function (obj) {
    return _this.isObject(obj) && Object.keys(obj).length === 0;
  },

  isArray: function (value) {
    return Array.isArray(value);
  },

  isEmptyArray: function (array) {
    return _this.isArray(array) && array.length === 0;
  },

  map2Obj: function (map) {
    var res = {};

    if (!_this.isObject(map)) {
      throw new Error('map2Obj: invalid input');
    }

    Object.keys(map).forEach(function (attr) {
      try {
        res[attr] = JSON.parse(map[attr]);
      } catch (ex) {
        res[attr] = map[attr];
        throw new Error('map2Obj: json parse error');
      }
    });

    return res;
  },

  obj2Map: function (obj) {
    var res = {};

    if (!_this.isObject(obj)) {
      throw new Error('obj2Map: invalid input');
    }

    Object.keys(obj).forEach(function (attr) {

      // stringify every type of value, include 'boolean', 'string', 'number', 'object'
      res[attr] = JSON.stringify(obj[attr]);
    });

    return res;
  },

  // join 2 arrays to obj. first array is key; second array is value;
  joinArray2Obj: function (keyArray, valArray) {
    var res = {};

    if (!_this.isArray(keyArray) || !_this.isArray(valArray)) {
      throw new Error('joinArray2Obj: invalid input');
    }

    keyArray.forEach(function (key, i) {
      res[key] = valArray[i];
    });

    return res;
  },

  cloneObj: function (obj) {
    if (!_this.isObject(obj) && !_this.isArray(obj)) {
      throw new Error('cloneObj: invalid input');
    }

    return JSON.parse(JSON.stringify(obj));
  },

  // deep search empty fields in object, and remove it
  removeEmptyPropertiesDeeply: function (obj) {
    var funName = 'removeEmptyPropertiesDeeply';
    debug(funName, 'call');

    if (!_this.isObject(obj)) {
      throw new Error(`${funName}: invalid input`);
    }

    var stack = [];

    var run = function (obj) {
      Object.keys(obj).forEach(function (propName) {
        stack.push(propName);
        debug(stack, obj[propName]);

        if (_this.isEmptyValue(obj[propName])) {
          delete obj[propName];
        } else if (_this.isObject(obj[propName])) {
          _this.removeEmptyPropertiesDeeply(obj[propName]);

          // when all value in the object are empty value
          // e.g. { foo1: null, foo2: {} }
          if (Object.keys(obj[propName]).length === 0) {
            delete obj[propName];
          }
        }

        stack.pop();
      });
    };

    run(obj);

    debug(funName, 'done');
    return obj;
  },

  // - if attributes in desObj are not presented in srcObj,
  //   the attributes should be null
  // - if attributes are both in desObj & srcObj,
  //   the value of attributes in desObj should be replaced by that in srcObj
  updatePropertiesByObjDeeply: function (desObj, srcObj) {
    var funName = 'updatePropertiesByObjDeeply';
    debug(funName, 'call');

    if (!_this.isObject(desObj) || !_this.isObject(srcObj)) {
      throw new Error(`${funName}: invalid input`);
    }

    var stack = [];

    var run = function (desObj, srcObj) {
      Object.keys(desObj).forEach(function (propName) {
        var desValue = desObj[propName];
        var srcValue = srcObj[propName];

        stack.push(propName);
        debug(stack, desValue, srcValue);

        if (_this.isObject(desValue)) {
          if (_this.isObject(srcValue)) {
            run(desValue, srcValue);
          } else if (_this.isEmptyValue(srcValue)) { // null only, {} not goes here
            desObj[propName] = null;
          } else { // default value null
            _this.updatePropertiesByValueDeeply(desObj[propName], null);
          }
        } else {
          desObj[propName] = (srcValue === undefined) ? null : srcValue;
        }

        stack.pop();
      });
    };

    run(desObj, srcObj);

    debug(funName, 'done');
    return desObj;
  },

  updatePropertiesByValueDeeply: function (obj, value) {
    var funName = 'updatePropertiesByValueDeeply';
    debug(funName, 'call');

    if (!_this.isObject(obj)) {
      throw new Error(`${funName}: invalid input`);
    }

    var stack = [];

    var run = function (obj, value) {
      Object.keys(obj).forEach(function (propName) {
        stack.push(propName);
        debug(stack, obj[propName]);

        if (_this.isEmptyValue(obj[propName])) {

          // note here. when value of property is empty, not update the value
          obj[propName] = null;
        } else if (_this.isObject(obj[propName])) {
          run(obj[propName], value);
        } else {
          obj[propName] = value; // FIXME deep copy
        }

        stack.pop();
      });
    };

    run(obj, value);

    debug(funName, 'done');
    return obj;
  },

  pickDiffPropertiesDeeply: function (desObj, srcObj) {
    var funName = 'pickDiffPropertiesDeeply';
    debug(funName, 'call');

    if (!_this.isObject(desObj) || !_this.isObject(srcObj)) {
      throw new Error(`${funName}: invalid input`);
    }

    var stack = [];

    var run = function (desObj, srcObj) {
      Object.keys(desObj).forEach(function (propName) {
        var desValue = desObj[propName];
        var srcValue = srcObj[propName];

        stack.push(propName);
        debug(stack, desValue, srcValue);

        if (_this.isArray(desValue)) {
          if (_.isEqual(desValue, srcValue) || // deep comparison
            _this.isEmptyValue(desValue) || // remove empty properties
            _this.isEmptyValue(srcValue)) {
            delete desObj[propName];
          }
        } else if (_this.isObject(desValue) && _this.isObject(srcValue)) {
          run(desValue, srcValue);

          if (Object.keys(desObj[propName]).length === 0) {
            delete desObj[propName];
          }
        } else {
          if (desValue === srcValue ||
            _this.isEmptyValue(desValue) || // remove empty properties
            _this.isEmptyValue(srcValue)) {
            delete desObj[propName];
          }
        }

        stack.pop();
      });
    };

    run(desObj, srcObj);

    debug(funName, 'done');
    return desObj;
  },

  mergeObjDeeply: function (desObj, srcObj) {
    var funName = 'mergeObjDeeply';
    debug(funName, 'call');

    if (!_this.isObject(desObj) || !_this.isObject(srcObj)) {
      throw new Error(`${funName}: invalid input`);
    }

    var stack = [];

    var run = function (desObj, srcObj) {
      var desProps = Object.keys(desObj);
      desProps.forEach(function (propName) {
        stack.push(propName);
        debug(stack, desObj[propName], srcObj[propName]);

        if (_this.isObject(desObj[propName]) && _this.isObject(srcObj[propName])) {
          run(desObj[propName], srcObj[propName]);
        } else if (typeof srcObj[propName] !== 'undefined') {
          desObj[propName] = srcObj[propName];
        }

        stack.pop();
      });

      // additional props in srcObj, but not in desObj, just copy
      Object.keys(srcObj).forEach(function (propName) {
        if (desProps.indexOf(propName) < 0) {
          stack.push(propName);
          debug(stack, desObj[propName], srcObj[propName]);

          desObj[propName] = srcObj[propName]; //FIXME deep copy

          stack.pop();
        }
      });
    };

    run(desObj, srcObj);

    debug(funName, 'done');
    return desObj;
  },

  // return a promise or a callback
  functionReturn: function (promise, callback) {
    if (typeof callback === 'function') {
      return promise.then(function (data) {
        callback(null, data);
        return null;
      }).catch(callback);
    } else {
      return promise;
    }
  },

  getHrtimeMs: function () {
    var t = process.hrtime();
    return t[0] * 1e3 + t[1] * 1e-6; // in ms
  },

  getHrtimeMsDiff: function (startHrtime) {
    var t = process.hrtime(startHrtime);
    return t[0] * 1e3 + t[1] * 1e-6; // in ms
  },
};

module.exports = _this;
