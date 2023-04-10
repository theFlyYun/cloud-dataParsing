var _ = require('lodash');
var Promise = require('bluebird');
var expect = require('chai').expect;
var utils = require('../../../lib/utils');

describe('#utils', function () {

  var baseObj = {
    foo: null,
    fooS0: '',
    fooS1: 'bar1',
    fooN0: 0,
    fooN1: 10,
    fooB0: false,
    fooB1: true,
    fooA0: [],
    fooA1: [1],
    fooA2: ['bar'],
    fooA3: [{ foo: 'bar' }],
    fooO0: {},
  };

  var expNotObj =  function (fn) {
    expect(fn.bind(null, -10)).to.throw(Error);
    expect(fn.bind(null, 0)).to.throw(Error);
    expect(fn.bind(null, 100)).to.throw(Error);

    expect(fn.bind(null, false)).to.throw(Error);
    expect(fn.bind(null, true)).to.throw(Error);

    expect(fn.bind(null, [])).to.throw(Error);
    expect(fn.bind(null, ['foo'])).to.throw(Error);

    //expect(fn.bind(null, {})).to.throw(Error);
    //expect(fn.bind(null, { foo: 'bar' })).to.throw(Error);

    expect(fn.bind(null, undefined)).to.throw(Error);
    expect(fn.bind(null, null)).to.throw(Error);
  };

  describe('- isEmptyValue()', function () {
    var fn = utils.isEmptyValue;
    it('should return true when value is null, undefined or {}', function () {
      expect(fn(null)).to.be.eql(true);
      expect(fn(undefined)).to.be.eql(true);
      expect(fn({})).to.be.eql(true);
    });

    it('should return false when value is others', function () {
      // string
      expect(fn('')).to.be.eql(false);
      expect(fn('str')).to.be.eql(false);

      // number
      expect(fn(-10)).to.be.eql(false);
      expect(fn(0)).to.be.eql(false);
      expect(fn(100)).to.be.eql(false);

      // boolean
      expect(fn(true)).to.be.eql(false);
      expect(fn(false)).to.be.eql(false);

      // array
      expect(fn([])).to.be.eql(false);
      expect(fn(['foo'])).to.be.eql(false);

      // object
      expect(fn({ foo: 'bar' })).to.be.eql(false);
    });
  });

  describe('- isString()', function () {
    var fn = utils.isString;
    it('should return true when value is string', function () {
      expect(fn('')).to.be.eql(true);
      expect(fn('foo')).to.be.eql(true);
    });

    it('should return false when value is others', function () {
      // number
      expect(fn(-10)).to.be.eql(false);
      expect(fn(0)).to.be.eql(false);
      expect(fn(100)).to.be.eql(false);

      // boolean
      expect(fn(true)).to.be.eql(false);
      expect(fn(false)).to.be.eql(false);

      // array
      expect(fn([])).to.be.eql(false);
      expect(fn(['foo'])).to.be.eql(false);

      // object
      expect(fn({ foo: 'bar' })).to.be.eql(false);

      // others
      expect(fn(undefined)).to.be.eql(false);
      expect(fn(null)).to.be.eql(false);
    });
  });

  describe('- isObject()', function () {
    var fn = utils.isObject;
    it('should return true when value is object', function () {
      expect(fn({})).to.be.eql(true);
      expect(fn({ foo: 'bar' })).to.be.eql(true);
    });

    it('should return false when value is others', function () {
      // number
      expect(fn(-10)).to.be.eql(false);
      expect(fn(0)).to.be.eql(false);
      expect(fn(100)).to.be.eql(false);

      // boolean
      expect(fn(true)).to.be.eql(false);
      expect(fn(false)).to.be.eql(false);

      // array
      expect(fn([])).to.be.eql(false);
      expect(fn(['foo'])).to.be.eql(false);

      // others
      expect(fn(undefined)).to.be.eql(false);
      expect(fn(null)).to.be.eql(false);
    });
  });

  describe('- isEmptyObject()', function () {
    var fn = utils.isEmptyObject;
    it('should return true when value is object', function () {
      expect(fn({})).to.be.eql(true);
    });

    it('should return false when value is others', function () {
      // number
      expect(fn(-10)).to.be.eql(false);
      expect(fn(0)).to.be.eql(false);
      expect(fn(100)).to.be.eql(false);

      // boolean
      expect(fn(true)).to.be.eql(false);
      expect(fn(false)).to.be.eql(false);

      // array
      expect(fn([])).to.be.eql(false);
      expect(fn(['foo'])).to.be.eql(false);

      // object
      expect(fn({ foo: 'bar' })).to.be.eql(false);

      // others
      expect(fn(undefined)).to.be.eql(false);
      expect(fn(null)).to.be.eql(false);
    });
  });

  describe('- isArray()', function () {
    var fn = utils.isArray;
    it('should return true when value is object', function () {
      // array
      expect(fn([])).to.be.eql(true);
      expect(fn(['foo'])).to.be.eql(true);
    });

    it('should return false when value is others', function () {
      // number
      expect(fn(-10)).to.be.eql(false);
      expect(fn(0)).to.be.eql(false);
      expect(fn(100)).to.be.eql(false);

      // boolean
      expect(fn(true)).to.be.eql(false);
      expect(fn(false)).to.be.eql(false);

      // object
      expect(fn({})).to.be.eql(false);
      expect(fn({ foo: 'bar' })).to.be.eql(false);

      // others
      expect(fn(undefined)).to.be.eql(false);
      expect(fn(null)).to.be.eql(false);
    });
  });

  describe('- isEmptyArray()', function () {
    var fn = utils.isEmptyArray;
    it('should return true when value is object', function () {
      // array
      expect(fn([])).to.be.eql(true);
    });

    it('should return false when value is others', function () {
      // number
      expect(fn(-10)).to.be.eql(false);
      expect(fn(0)).to.be.eql(false);
      expect(fn(100)).to.be.eql(false);

      // boolean
      expect(fn(true)).to.be.eql(false);
      expect(fn(false)).to.be.eql(false);

      // object
      expect(fn({})).to.be.eql(false);
      expect(fn({ foo: 'bar' })).to.be.eql(false);

      // array
      expect(fn(['foo'])).to.be.eql(false);

      // others
      expect(fn(undefined)).to.be.eql(false);
      expect(fn(null)).to.be.eql(false);
    });
  });

  describe('- map2Obj()', function () {
    var fn = utils.map2Obj;
    it('should throw an error unless value is not a map (object)', expNotObj.bind(null, fn));

    it('should throw an error unless value is invalid', function () {
      var map = {
        foo: '\"bar\"',
        foo1: 'true',
        foo2: '1234',
        foo3: '[\"foo\"]',
        foo4: '{\"foo\":\"bar}', // <- this value is error
      };

      expect(fn.bind(null, map)).to.throw(Error);
    });

    it('should return an object when value is a map', function () {
      var map = {
        foo: '\"bar\"',
        foo1: 'true',
        foo2: '1234',
        foo3: '[\"foo\"]',
        foo4: '{\"foo\":\"bar\"}',
      };

      var obj = {
        foo: 'bar',
        foo1: true,
        foo2: 1234,
        foo3: ['foo'],
        foo4: { foo: 'bar' },
      };

      expect(fn(map)).to.be.eql(obj);
      expect(fn({})).to.be.eql({});
    });
  });

  describe('- obj2Map()', function () {
    var fn = utils.obj2Map;
    it('should throw an error unless value is not a object', expNotObj.bind(null, fn));

    it('should return a map when value is an object', function () {
      var map = {
        foo: '\"bar\"',
        foo1: 'true',
        foo2: '1234',
        foo3: '[\"foo\"]',
        foo4: '{\"foo\":\"bar\"}',
      };

      var obj = {
        foo: 'bar',
        foo1: true,
        foo2: 1234,
        foo3: ['foo'],
        foo4: { foo: 'bar' },
      };

      expect(fn(obj)).to.be.eql(map);
      expect(fn({})).to.be.eql({});
    });
  });

  describe('- joinArray2Obj()', function () {
    var fn = utils.joinArray2Obj;
    it('should throw an error unless values are not arrays', function () {
      expect(fn.bind(null, -10)).to.throw(Error);
      expect(fn.bind(null, 0)).to.throw(Error);
      expect(fn.bind(null, 100)).to.throw(Error);

      expect(fn.bind(null, false)).to.throw(Error);
      expect(fn.bind(null, true)).to.throw(Error);

      //expect(fn.bind(null, [])).to.throw(Error);
      //expect(fn.bind(null, ['foo'])).to.throw(Error);

      expect(fn.bind(null, {})).to.throw(Error);
      expect(fn.bind(null, { foo: 'bar' })).to.throw(Error);

      expect(fn.bind(null, undefined)).to.throw(Error);
      expect(fn.bind(null, null)).to.throw(Error);
    });

    it('should return an object when values are arrays', function () {
      var params1 = ['foo1', 'foo2', 'foo3'];
      var params2 = ['bar1', 'bar2', 'bar3', 'bar4'];
      var obj = {
        foo1: 'bar1',
        foo2: 'bar2',
        foo3: 'bar3',
      };

      expect(fn(params1, params2)).to.be.eql(obj);
      expect(fn([], [])).to.be.eql({});
      expect(fn([], ['bar'])).to.be.eql({});
    });
  });

  describe('- cloneObj()', function () {
    var fn = utils.cloneObj;
    it('should throw an error unless value is not object or array', function () {
      expect(fn.bind(null, -10)).to.throw(Error);
      expect(fn.bind(null, 0)).to.throw(Error);
      expect(fn.bind(null, 100)).to.throw(Error);

      expect(fn.bind(null, false)).to.throw(Error);
      expect(fn.bind(null, true)).to.throw(Error);

      //expect(fn.bind(null, [])).to.throw(Error);
      //expect(fn.bind(null, ['foo'])).to.throw(Error);

      //expect(fn.bind(null, {})).to.throw(Error);
      //expect(fn.bind(null, { foo: 'bar' })).to.throw(Error);

      expect(fn.bind(null, undefined)).to.throw(Error);
      expect(fn.bind(null, null)).to.throw(Error);
    });

    it('should return a new object/array when value is object/array', function () {
      var obj = {
        foo1: 'bar1',
        foo2: 'bar2',
        foo3: 'bar3',
      };

      var array = ['bar1', 'bar2', 'bar3'];

      expect(fn(obj)).to.be.eql(obj);
      expect(fn(obj)).to.be.not.equal(obj);
      expect(fn(array)).to.be.eql(array);
      expect(fn(array)).to.be.not.equal(array);
    });
  });

  describe('- removeEmptyPropertiesDeeply()', function () {
    var fn = utils.removeEmptyPropertiesDeeply;
    it('should throw an error when value is not object', expNotObj.bind(null, fn));

    it('should return the same object when no empty value inside', function () {
      // input
      var baseObjNoEmpty = _.omit(baseObj, ['foo', 'fooO0']);
      var obj = utils.cloneObj(baseObjNoEmpty);
      obj.subObj = utils.cloneObj(baseObjNoEmpty);

      // output
      var expRes = utils.cloneObj(obj);

      var res = fn(obj);
      expect(res).to.be.eql(obj); // modify it self
      expect(res).to.be.eql(expRes);
    });

    it('should remove empty value in object', function () {
      var empty = {
        foo: null,
        fooO0: {},
      };

      // input
      var obj = utils.cloneObj(baseObj);
      obj.subObj = utils.cloneObj(baseObj);
      obj.empty = utils.cloneObj(empty); // all values in the object are empty

      // output
      var baseObjNoEmpty = _.omit(baseObj, ['foo', 'fooO0']);
      var expRes = utils.cloneObj(baseObjNoEmpty);
      expRes.subObj = utils.cloneObj(baseObjNoEmpty);

      //console.log(JSON.stringify(obj, null, 2), JSON.stringify(expRes, null, 2));

      var res = fn(obj);
      expect(res).to.be.eql(obj); // modify it self
      expect(res).to.be.eql(expRes);
    });
  });

  describe('- updatePropertiesByObjDeeply()', function () {
    var fn = utils.updatePropertiesByObjDeeply;
    it('should throw an error when values are not objects', function () {
      // first parameter
      expect(fn.bind(null, -10, {})).to.throw(Error);
      expect(fn.bind(null, 0, {})).to.throw(Error);
      expect(fn.bind(null, 100, {})).to.throw(Error);

      expect(fn.bind(null, false, {})).to.throw(Error);
      expect(fn.bind(null, true, {})).to.throw(Error);

      expect(fn.bind(null, [], {})).to.throw(Error);
      expect(fn.bind(null, ['foo'], {})).to.throw(Error);

      expect(fn.bind(null, undefined, {})).to.throw(Error);
      expect(fn.bind(null, null, {})).to.throw(Error);

      // second parameter
      expect(fn.bind(null, {}, -10)).to.throw(Error);
      expect(fn.bind(null, {}, 0)).to.throw(Error);
      expect(fn.bind(null, {}, 100)).to.throw(Error);

      expect(fn.bind(null, {}, false)).to.throw(Error);
      expect(fn.bind(null, {}, true)).to.throw(Error);

      expect(fn.bind(null, {}, [])).to.throw(Error);
      expect(fn.bind(null, {}, ['foo'])).to.throw(Error);

      expect(fn.bind(null, {}, undefined)).to.throw(Error);
      expect(fn.bind(null, {}, null)).to.throw(Error);
    });

    it('should update all values in object1 by object2', function () {
      //FIXME this test should be seperated
      // input obj1
      var obj1 = utils.cloneObj(baseObj);
      obj1.subObj1 = utils.cloneObj(baseObj);
      obj1.subObj2 = utils.cloneObj(baseObj);

      // input obj2
      var baseObj2 = {
        fooN1: 11,
        fooA1: [2],
        fooA3: [{ foo: 'barbar' }],
        fooA4: [4], // new attribute
      };

      var obj2 = utils.cloneObj(baseObj2);
      obj2.subObj1 = utils.cloneObj(baseObj2);
      obj2.subObj2 = 'foo';

      // output
      var empty = {};
      Object.keys(baseObj).forEach(function (key) {
        empty[key] = null;
      });

      var expRes = utils.cloneObj(empty);
      expRes.subObj1 = utils.cloneObj(empty);
      expRes.subObj2 = utils.cloneObj(empty);
      _.assign(expRes, _.omit(baseObj2, 'fooA4'));
      _.assign(expRes.subObj1, _.omit(baseObj2, 'fooA4'));

      //console.log('obj1:\n', JSON.stringify(obj1, null, 2));
      //console.log('obj2:\n', JSON.stringify(obj2, null, 2));
      //console.log('expRes:\n', JSON.stringify(expRes, null, 2));
      //console.log('res:\n', JSON.stringify(res, null, 2));

      var res = fn(obj1, obj2);
      expect(res).to.be.eql(obj1);
      expect(res).to.be.eql(expRes);
    });
  });

  describe('- updatePropertiesByValueDeeply()', function () {
    var fn = utils.updatePropertiesByValueDeeply;
    it('should throw an error when values are not objects', function () {
      expect(fn.bind(null, -10, {})).to.throw(Error);
      expect(fn.bind(null, 0, {})).to.throw(Error);
      expect(fn.bind(null, 100, {})).to.throw(Error);

      expect(fn.bind(null, false, {})).to.throw(Error);
      expect(fn.bind(null, true, {})).to.throw(Error);

      expect(fn.bind(null, [], {})).to.throw(Error);
      expect(fn.bind(null, ['foo'], {})).to.throw(Error);

      expect(fn.bind(null, undefined, {})).to.throw(Error);
      expect(fn.bind(null, null, {})).to.throw(Error);
    });

    it('should update all values in object1 by value', function () {
      // input obj1
      var obj1 = utils.cloneObj(baseObj);
      obj1.subObj1 = utils.cloneObj(baseObj);

      // input value
      var value = 'target value';

      // output
      var targetObj = {};
      Object.keys(baseObj).forEach(function (key) {
        targetObj[key] = utils.isEmptyValue(baseObj[key]) ? null : value;
      });

      var expRes = utils.cloneObj(targetObj);
      expRes.subObj1 = utils.cloneObj(targetObj);

      //console.log('expRes:\n', JSON.stringify(expRes, null, 2));

      var res = fn(obj1, value);
      expect(res).to.be.eql(obj1);
      expect(res).to.be.eql(expRes);
    });
  });

  describe('- pickDiffPropertiesDeeply()', function () {
    var fn = utils.pickDiffPropertiesDeeply;
    it('should throw an error when values are not objects', function () {
      // first parameter
      expect(fn.bind(null, -10, {})).to.throw(Error);
      expect(fn.bind(null, 0, {})).to.throw(Error);
      expect(fn.bind(null, 100, {})).to.throw(Error);

      expect(fn.bind(null, false, {})).to.throw(Error);
      expect(fn.bind(null, true, {})).to.throw(Error);

      expect(fn.bind(null, [], {})).to.throw(Error);
      expect(fn.bind(null, ['foo'], {})).to.throw(Error);

      expect(fn.bind(null, undefined, {})).to.throw(Error);
      expect(fn.bind(null, null, {})).to.throw(Error);

      // second parameter
      expect(fn.bind(null, {}, -10)).to.throw(Error);
      expect(fn.bind(null, {}, 0)).to.throw(Error);
      expect(fn.bind(null, {}, 100)).to.throw(Error);

      expect(fn.bind(null, {}, false)).to.throw(Error);
      expect(fn.bind(null, {}, true)).to.throw(Error);

      expect(fn.bind(null, {}, [])).to.throw(Error);
      expect(fn.bind(null, {}, ['foo'])).to.throw(Error);

      expect(fn.bind(null, {}, undefined)).to.throw(Error);
      expect(fn.bind(null, {}, null)).to.throw(Error);
    });

    it('should update all values in object1 by value', function () {
      //FIXME this test should be seperated
      // input obj1
      var obj1 = utils.cloneObj(baseObj);
      obj1.subObj = utils.cloneObj(baseObj);

      // input obj2
      var diff = {
        fooS0: 'ssss',
        fooN1: 11,
        fooA1: [2],
        fooA3: [{ foo: 'barbar' }],
      };

      var baseObj2 = _.assign(utils.cloneObj(baseObj), diff);

      var obj2 = utils.cloneObj(baseObj2);
      obj2.subObj = utils.cloneObj(baseObj2);

      // output
      var expRes = _.pick(baseObj, Object.keys(diff));
      expRes.subObj = _.pick(baseObj, Object.keys(diff));

      //console.log('obj1:\n', JSON.stringify(obj1, null, 2));
      //console.log('obj2:\n', JSON.stringify(obj2, null, 2));
      //console.log('expRes:\n', JSON.stringify(expRes, null, 2));

      var res = fn(obj1, obj2);

      //console.log('res:\n', JSON.stringify(res, null, 2));
      expect(res).to.be.eql(obj1);
      expect(res).to.be.eql(expRes);
    });
  });

  describe('- mergeObjDeeply()', function () {
    var fn = utils.mergeObjDeeply;
    it('should throw an error when values are not objects', function () {
      // first parameter
      expect(fn.bind(null, -10, {})).to.throw(Error);
      expect(fn.bind(null, 0, {})).to.throw(Error);
      expect(fn.bind(null, 100, {})).to.throw(Error);

      expect(fn.bind(null, false, {})).to.throw(Error);
      expect(fn.bind(null, true, {})).to.throw(Error);

      expect(fn.bind(null, [], {})).to.throw(Error);
      expect(fn.bind(null, ['foo'], {})).to.throw(Error);

      expect(fn.bind(null, undefined, {})).to.throw(Error);
      expect(fn.bind(null, null, {})).to.throw(Error);

      // second parameter
      expect(fn.bind(null, {}, -10)).to.throw(Error);
      expect(fn.bind(null, {}, 0)).to.throw(Error);
      expect(fn.bind(null, {}, 100)).to.throw(Error);

      expect(fn.bind(null, {}, false)).to.throw(Error);
      expect(fn.bind(null, {}, true)).to.throw(Error);

      expect(fn.bind(null, {}, [])).to.throw(Error);
      expect(fn.bind(null, {}, ['foo'])).to.throw(Error);

      expect(fn.bind(null, {}, undefined)).to.throw(Error);
      expect(fn.bind(null, {}, null)).to.throw(Error);
    });

    it('should merge two object', function () {
      var obj1 = utils.cloneObj(baseObj);
      var obj2 = {
        fooN1: 11,
        fooA1: [2],
        fooA3: [{ foo: 'barbar' }],
        fooA4: [4], // new attribute
      };

      var expRes = utils.cloneObj(obj1);
      _.assign(expRes, obj2);

      expect(fn(obj1, obj2)).to.be.eql(expRes);
    });

    it('should merge two object deeply', function () {
      var obj1 = utils.cloneObj(baseObj);
      obj1.subObj = utils.cloneObj(baseObj);

      var baseObj2 = {
        fooN1: 11,
        fooA1: [2],
        fooA3: [{ foo: 'barbar' }],
        fooA4: [4], // new attribute
      };

      var obj2 = utils.cloneObj(baseObj2);
      obj2.subObj = utils.cloneObj(baseObj2);

      var expRes = utils.cloneObj(obj1);
      _.assign(expRes, baseObj2);
      _.assign(expRes.subObj, baseObj2);

      expect(fn(obj1, obj2)).to.be.eql(expRes);
    });
  });

  describe('- functionReturn()', function () {
    var fn = utils.functionReturn;
    var data = 'foo';
    var promise = Promise.resolve(data);
    it('should return a promise when callback is not a function', function (done) {
      expect(fn(promise, '1')).to.be.eql(promise);
      expect(fn(promise, 0)).to.be.eql(promise);
      expect(fn(promise, [])).to.be.eql(promise);
      expect(fn(promise, true)).to.be.eql(promise);
      expect(fn(promise, {})).to.be.eql(promise);
      fn(promise).then(function (reply) {
        expect(reply).to.be.eql(data);
        done();
      });
    });

    it('should call the callback when callback is a function', function (done) {
      fn(promise, function (err, reply) {
        expect(reply).to.be.eql(data);
        done();
      });
    });
  });
});

