var DbClient = require('cloud-lib').DbClient;

var dbClient = null;

var createDbClient = function (opts) {
  if (!dbClient) {
    dbClient = new DbClient(opts);
  }

  return dbClient;
};

module.exports = createDbClient;
