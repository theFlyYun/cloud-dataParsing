/*
 * @Author: Long Yunfei & xuyt
 * @Date: 2023-04-11 00:03:24
 * @LastEditTime: 2023-04-11 14:57:45
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: kafka获取数据并解析
 */

const config = require('../config/dataparsing/config.js');
const PBConfig = config.pb
const POConfig = config.productkey2object
const ProtoBuf = require('./protoBufferUnit/protoBufferUnit');
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
var ERROR = require('./defines.json').ERROR;

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

  // console.log(options)
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

  // console.log(new MqClient(this.options.msgQueue))
  /* backend client init */  //后端初始化

  // //此处卡住
  const dbClient = this.dbClient = callWatcherHelper.createWatchCallsObject('dbClient', new DbClient(this.options.database));
  const mqClient = this.mqClient = callWatcherHelper.createWatchCallsObject('mqClient', new MqClient(this.options.msgQueue));

  function messageHandler(message) {
    if (typeof message.value !== 'object') {
      logger.error('Invalid message', message);
      return;
    }

    var topic = message.value.topic;
    var payload = message.value.payload;

    var req = {
      raw: message,
      error: null,
      topic: topic,
      payload: payload,
      timestamp: +moment().unix(), // request timestamp
      response: [], // for logging response
      aggregation: 0, // aggregation counter
      hrtime: process.hrtime(),
    };

    var from = message.value.from;
    if (utils.isEmptyObject(from) ||//既没有UID也没有DID
      (!from.hasOwnProperty('uid') && !from.hasOwnProperty('did'))) {
      errorHandler(req, new Error('unknown client type'));
      logHandler(req);
      return;
    }

    try {
      req.topic = controller.tryParseTopic(topic);
    } catch (err) { // topic error do not send response
      errorHandler(req, err);
      logHandler(req);
      return;
    }

    new Promise(function (resolve, reject) {
      req.payload = (req.topic.operation === 'update') ?
        controller.tryParseMqttUpdatePayload(payload) :
        controller.tryParseMqttGetPayload(payload);

 
      var did = req.topic.did;
      const reply = dbClient.readDevice(did, 'product_key');
      var productKey = reply.product_key;
      if(PBConfig.hasOwnProperty(productKey)&&POConfig.hasOwnProperty(productKey))
      {
        const payloads = req.payload
        const base64  = payloads.state.reported.payload
        const buff = Buffer.from(base64, 'base64');
        payload = buff.toString('hex');
      
        messages.payload = ProtoBuf.ProtoBuf(payload,productKey)
      }
    
    });
  }
  let messageHandlerWithWatch = callWatcherHelper.createWatchCallsFunc('messageHandler', messageHandler);
  /* pre-startup & startup */
  var onReady = function (client, event) {
    return new Promise(function (resolve, reject) {
      if (!event) { return resolve(); } // FIXME

      client.once(event, function () {
        return resolve();
      });
    });
  };

  var preStartup = function () {
    return Promise.resolve();
  };
  
  /* main */
  Promise.all([
    onReady(mqClient, 'connect'),
  ]).then(function () {
    return preStartup();
  }).then(function () {
    // start up

    console.log("start??")

    mqClient.on('messageParseValue', messageHandlerWithWatch);

    return null;
  }).catch(function (err) {
    // this should never happen
    console.log(err.stack);
    _this.close();
  });

}

inherits(dataParsing, events.EventEmitter);

var prototype = dataParsing.prototype;


prototype.close = function () {
  ZkClientPool.getDefault().clear();
  return Promise.all([
    this.mqClient.disconnect(),
    // this.dbClient.disconnect(),
  ]);
};

module.exports = dataParsing;




