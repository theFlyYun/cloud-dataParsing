var cloudLib = require('cloud-lib');
var DbClient = cloudLib.DbClient;
var CacheDbClient = cloudLib.CacheDbClient;
// var config = require('../config');

var dbClient = null;

var createDbClient = function (opts) {
  if (!dbClient) {
    dbClient = new CacheDbClient(new DbClient(opts));
    // dbClient = new CacheDbClient(new DbClient(opts), {
    //   logger: require('./logger')({ level: config.log_level }),
    // });
  }

  return dbClient;
};

module.exports = createDbClient;
