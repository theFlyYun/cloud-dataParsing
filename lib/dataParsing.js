/*
 * @Author: Long Yunfei & xuyt
 * @Date: 2023-04-11 00:03:24
 * @LastEditTime: 2023-04-11 09:17:33
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: kafka获取数据并解析
 */

var debug = require('debug')('deviceShadow');
var _ = require('lodash');
var events = require('events');
var inherits = require('util').inherits;
var util = require('util');
var Promise = require('bluebird');
var moment = require('moment');

var appMonitorHelper = require('./AppMonitorHelper').getInstance();
var callWatcherHelper = require('./CallWatcherHelper').getInstance();

var DbClient = require('./dbClient/redis');
var MqClient = require('./mqClient/kafka');
var utils = callWatcherHelper.createWatchCallsObject('utils', require('./utils'));
var controller = callWatcherHelper.createWatchCallsObject('controller', require('./controller'));
var Logger = require('./logger');
var Queue = require('./queue');
var Error = require('./error');
var ERROR = require('./defines').ERROR;

var cloudLib = require('cloud-lib');
var ServiceRegistry = cloudLib.ServiceRegistry;
var ZkClientPool = cloudLib.ZkClientPool;

var defaultOptions = {
  database: {
    db: 'redis',
    cluster: false,
    options: [{ host: 'localhost', port: '6379' }],//HOST 得改？
  },
  msgQueue: {
    mq: 'redis',
    cluster: false,
    options: [{ host: 'localhost', port: '6379' }],
  },
};

var LOCKARGS = {
  timeout: 10,
  attempts: 10,
};


function dataParsing(options){
    //FIX ME
    var _this = this;

    /* properties */
    this.options = options || {};
    _.defaults(this.options, defaultOptions);//给目标对象分配database与msgQueue未定义的属性
  
    ZkClientPool.installDefault(new ZkClientPool({
      zkClientOptions: { connectionString: this.options.serviceRegistry.connectionString },
    }));
  
    const cloudid = this.options.cloudid;
    const shadowid = this.options.shadowid;
  
    if (!cloudid || !shadowid) {//clouid与shadowid是否合法
      throw new Error(`Invalid cloudid ${cloudid} or shadowid ${shadowid}`);
    }
  
    // redis psubscribe not support regular expression
    this.subTopics = [  //订阅主题
      '$rlwio/devices/*/shadow/update',
      '$rlwio/devices/*/shadow/get',
    ];
  
    this._queueCache = {};   //
  
    /* backend client init */  //后端初始化
    const dbClient = this.dbClient = callWatcherHelper.createWatchCallsObject('dbClient', new DbClient(this.options.database));
    const mqClient = this.mqClient = callWatcherHelper.createWatchCallsObject('mqClient', new MqClient(this.options.msgQueue));
    const logger = callWatcherHelper.createWatchCallsObject('logger', new Logger(this.options.logger));

}

inherits(dataParsing, events.EventEmitter);

var prototype = dataParsing.prototype;

prototype.close = function () {
  ZkClientPool.getDefault().clear();
  return Promise.all([
    this.mqClient.disconnect(),
    this.dbClient.disconnect(),
  ]);
};

module.exports = dataParsing;




