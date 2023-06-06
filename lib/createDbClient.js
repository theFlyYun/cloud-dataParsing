// var DbClient = require('./databasesClient/cloudDbClient');
// var config = require('../config');
// const dbClient = this.dbClient = new DbClient(config.databases);
// module.export=dbClient.readDevice()

var cloudLib = require('cloud-lib');
var DbClient = cloudLib.DbClient;
var CacheDbClient = cloudLib.CacheDbClient;

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