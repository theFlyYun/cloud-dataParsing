var utils = require('../lib/utils');
var _ = require('lodash');

var desObj = {
  a: {
    bb: {
      ccc: {
        a: 1,
        c: 2,
      },
      ddd: [1, 2, 3],
    },
  },
  b: 123,
  c: [1, 2, 3],
};

var srcObj = {
  a: {
    bb: {
      ccc: '123',
    },
  },
  b: 10,
  f: {
    haha: 'hehe',
    array: [1, 2, 3],
  },
};

console.log('des:\n', JSON.stringify(desObj, null, 2));
console.log('src:\n', JSON.stringify(srcObj, null, 2));
utils.mergeObjDeeply(desObj, srcObj);
console.log('out:\n', JSON.stringify(desObj, null, 2));

var array1 = [desObj];
var array2 = [srcObj];
_.merge(array1, array2);

var string = '123';
