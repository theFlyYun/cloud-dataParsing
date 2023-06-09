var AppMonitor = require('cloud-lib/lib/appMonitor').AppMonitor;
var collectFunctions = require('cloud-lib/lib/appMonitor').collectFunctions;
var createClient = require('../dbClient');
var config = require('../../config/config4mqtt');
var utils = require('../utils');
var util = require('util');
var _ = require('lodash');

var redis;

function MonitorData(key, r = true) {
  var count = 0;
  this.needReset = r;
  this.key = key;
  this.reset = function () {
    if (this.needReset) {
      count = 0;
    }
  };

  this.addCount = function (c) {
    count += c;
  };

  this.count = function () {
    return count;
  };
}

var manager;
var countVars = {};

function MonitorManager() { }

var allCollectFuncions = {
  publishAvgResponseTime: function () {
    var res = 0;
    if (countVars.publishCount.count() !== 0) {
      res = countVars.publishTime.count() / countVars.publishCount.count();
    }

    return Promise.resolve(parseFloat(res.toFixed(2)));
  },

  publishRequestCount: function () {
    return Promise.resolve(countVars.publishCount.count());
  },

  subscribeRequestCount: function () {
    return Promise.resolve(countVars.subscribe.count());
  },

  connectedCount: function () {
    return Promise.resolve(countVars.connectedCount.count());
  },

  toClientBytes: function () {
    return Promise.resolve(countVars.toClientBytes.count());
  },

  fromClientBytes: function () {
    return Promise.resolve(countVars.fromClientBytes.count());
  },

  toKafkaBytes: function () {
    return Promise.resolve(countVars.toKafkaBytes.count());
  },

  fromKafkaBytes: function () {
    return Promise.resolve(countVars.fromKafkaBytes.count());
  },

  cpuUsage: collectFunctions.cpuCollectFunc(process.pid),
  memUsage: collectFunctions.memCollectFunc(process.pid),
};

MonitorManager.prototype.monitorStart = function () {
  var db = createClient();

  var avgMonitor = new AppMonitor({
    dumpFunction: function (data) {
      console.log(JSON.stringify(data));
      if (_.isEmpty(data)) {
        return;
      }

      redis.set(`cloudMqttServer:${config.mqttid}`, JSON.stringify(data)).then(function () {

        //reset
        Object.keys(countVars).forEach(function (key) {
          const element = countVars[key];
          element.reset();
        });
      });
    },

    collectInterval: 2 * 60,
    collectFunctions: allCollectFuncions,
  });

  //monitor start

  // avgMonitor.pdump();
  avgMonitor.pcollect();
  avgMonitor.on('pcollect', function () {
    avgMonitor.dump();
  });
};

MonitorManager.prototype.registCountVar = function (key, r) {
  var count = countVars[key];
  if (!count) {
    count = new MonitorData(key, r);
    countVars[key] = count;
  }

  return count;
};

MonitorManager.prototype.getCountVar = function (key) {
  return countVars[key];
};

var createMonitorManager = function () {
  if (!manager) {
    manager = new MonitorManager();
    redis = createClient(config.database)._redis._ioredis;
  }

  return manager;
};

module.exports = createMonitorManager;
