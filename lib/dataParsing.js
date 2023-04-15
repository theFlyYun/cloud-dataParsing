/*
 * @Author: Long Yunfei & xuyt
 * @Date: 2023-04-11 00:03:24
 * @LastEditTime: 2023-04-13 22:20:52
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
var Redis = require('ioredis');

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

var cloudDbClient = require('./dbClient/cloudDbClient');
var databasesOption = require('../config/databases.js').databases
var getPK = require("./utils/getlist.js").getproductkey

var redis = new Redis(config.msgQueue.options);


var cloudLib = require('cloud-lib');
const promise = require('bluebird/js/release/promise.js');
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
  /* backend client init */  //后端初始化

  // console.log(new MqClient(this.options.msgQueue))

  //此处卡住
  // const cloudDb=new cloudDbClient(databasesOption)
  const mqclient4productor = new MqClient(this.options.msgQueue)
  const dbClient = this.dbClient = callWatcherHelper.createWatchCallsObject('dbClient', new DbClient(this.options.database));
  const mqClient = this.mqClient = callWatcherHelper.createWatchCallsObject('mqClient', mqclient4productor);
  const logger = callWatcherHelper.createWatchCallsObject('logger', new Logger(this.options.logger));


  //   /* private functions */
  // function sendPacket(req, stateObject, status, version) {//发送包
  //   var did = req.topic.did;
  //   var operation = req.topic.operation;
  //   var timestamp = req.timestamp;
  //   var clientToken = req.payload.clientToken;

  //   // build response topic and payload  构建响应主题和负载
  //   var topic = controller.buildTopic(did, operation, status);
  //   var payload = controller.buildPayload(
  //     stateObject,
  //     version,
  //     clientToken,
  //     timestamp
  //   );

  //   var replyMqtt = function () {
  //     return dbClient.readMqttSubscribeByTopic(topic)
  //       .then(function (items) {
  //         var hasExternal = false;
  //         var hasInternal = false;
  //         var ops = [];

  //         items.forEach(function (location) {//依次检测 cid与cloudid 
  //           if (location.cid === cloudid) {
  //             hasInternal = true;
  //           } else {
  //             hasExternal = true;
  //           }
  //         });

  //         if (hasInternal) { // id相同交由 message dispatch
  //           ops.push(mqClient.replyMqttPublish2Dispatch(topic, payload, {//入栈
  //             cid: cloudid,
  //             mid: 'empty',
  //             did: did,
  //             isInternal: true,
  //           }));
  //         }

  //         if (hasExternal) { // id不同交由 kafka center
  //           ops.push(mqClient.replyMqttPublish2Dispatch(topic, payload, { //放回？
  //             cid: cloudid,
  //             mid: 'empty',
  //             did: did,
  //             isInternal: false,
  //           }));
  //         }

  //         return Promise.all(ops);
  //       });
  //   };

  //   var replyHttp = function () {
  //     if (req.raw.topic.match('http') === null) {
  //       return;
  //     }

  //     if (operation !== 'get') {//不用回应的情况
  //       return;
  //     }

  //     return mqClient.replyHttpPublish(topic, payload, {
  //       reqMsgId: req.raw.value.id, // get request message id
  //       cid: req.raw.value.cid,
  //       httpid: req.raw.value.httpid,
  //       did: did,
  //       isInternal: (req.raw.value.cid === cloudid),
  //     });
  //   };

  //   return Promise.all([//返回全部参数（Promise对象）状态
  //     replyMqtt(),
  //     replyHttp(),
  //   ]);
  // }

  // let sendPacketWithWatch = callWatcherHelper.createWatchCallsFunc('sendPacket', sendPacket);


  function logHandler(req) {
    var log = _.assign({}, req);
    log.topic = req.topic.toString();//request存储

    if (req.error && req.error.code === 500) {//打印错误信息 其中"500": "Internal service failure"
      console.error(req.error.stack);
    }

    logger.verbose(log);
  }

  function errorHandler(req, err) {
    err.code = err.code || 500;//？
    err.message = err.message || ERROR[err.code];
    req.error = err; // for logging
  }

  // function rejectHandler(req, err) {
  //   errorHandler(req, err);
  //   var error = _.pick(req.error, [     //_.pick(object, *keys) 根据键值返回过滤后副本
  //     'code',
  //     'message',
  //     'timestamp',
  //     'clientToken',
  //   ]);

  //   error.timestamp = req.timestamp; // must have timestamp
  //   return sendPacketWithWatch(req, error, 'rejected');
  // }

  function procMessage(req) { // main logical is here
    debug('messageHandler', 'call');


    return Promise.resolve().then(function () {

      // console.log(req.raw.topic, req.raw )

      // redis.publish(req.raw.value.topic ,req.payload.toString()).then(function (data) {
      //   console.log('send:', req.payload.toString());
      // });

      mqclient4productor.send([{ topic: req.raw.topic, messages: req.raw }])

    }).catch(function (err) {
      // return rejectHandler(req, err); // FIXME rejectHandler may be error
      return Promise.reject(err)
    }).finally(function () {
      debug('messageHandler', 'done');
      // logHandler(req); // logging
    });
  }

  let procMessageWithWatch = callWatcherHelper.createWatchCallsFunc('procMessage', procMessage);


  /* handlers */
  function queueWorkHandler() {
    var queue = this; // jscs:ignore safeContextKeyword   this:一个new Queue()
    var did = queue.did;

    debug('queueWorkerHandler call: *******************************');
    debug('queueWorkerHandler call: ', queue.isRunning, queue.length);
    if (queue.isRunning) {
      debug('queueWorkerHandler is running', queue.isRunning, queue.length);
      return null; // do nothing
    }

    if (queue.length <= 0) {
      debug('queueWorkerHandler queue is empty', queue.isRunning, queue.length);
      return null; // do nothing
    }

    queue.isRunning = true; // update state
    debug('queueWorkerHandler running: ', queue.isRunning, queue.length);

    dbClient.acquireShadowLock(did, LOCKARGS).then(function (reply) {
      // acquire lock success
      queue.identifier = reply; // save the lock identifier
      debug('queueWorkerHandler acquire lock+: ', queue.isRunning, queue.length);

      var reqs = [];
      for (let i = 0, l = queue.length; i < l; i++) {
        reqs.push(queue.shift());
      }

      var aggregatedReqs = controller.aggregateRequests(reqs);//res列表中保存两个变量devUpdateRequest与appUpdateRequest，根据请求类型，返回不同res（get 情况下，两元素为null）

      debug(
        'queueWorkerHandler after aggregation:',
        `queue(${queue.length}),`,
        `reqs(${reqs.length}),`,
        `aggregatedReqs(${aggregatedReqs.length})`
      );

      return Promise.mapSeries(aggregatedReqs, (req, i) => {
        debug('queueWorkerHandler proc: %d, %j', i, req);
        return procMessageWithWatch(req);
      }).then(function () {
        // proc done. procMessage always resolve.
        appMonitorHelper.onReqsProcessed(reqs);
        debug('queueWorkerHandler proc+: ', queue.isRunning, queue.length);
        return dbClient.releaseShadowLock(did, queue.identifier);
      }).then(function () {
        // release lock success
        debug('queueWorkerHandler release lock+: ', queue.isRunning, queue.length);
      }).catch(function (err) {
        // release lock error
        var req = aggregatedReqs[0]; // FIXME just use the one of the requests now
        errorHandler(req, err);
        logHandler(req);
        debug('queueWorkerHandler release lock-: ', queue.isRunning, queue.length);
      }).finally(function () {
        //debug('queueWorkerHandler delete data: ', queue.isRunning, queue.length);
      });

    }).catch(function (err) {
      // acquire lock error
      debug('queueWorkerHandler acquire lock-: ', queue.isRunning, queue.length);
    }).finally(function (err) {
      debug('queueWorkerHandler reset: ', queue.isRunning, queue.length);
      queue.isRunning = false; // update state

      if (queue.length > 0) {
        queue.emit('work'); // issue queueWorkerHandler once more
      }
    });
  }

  let queueWorkHandlerWithWatch = callWatcherHelper.createWatchCallsFunc('queueWorkHandler', queueWorkHandler);

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

    console.log("1:",req.raw.value)
    


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
      var did = req.topic.did;
      return resolve(getPK(did))
    
    }).then((productKey) => {
      return new Promise(function (resolve, rejected) {
        // // console.log(req)
        // var did = req.topic.did;
        // // console.log(did)

        // var productKey=getPK(did)

        var did = req.topic.did;
        // console.log("did:",did,"\nproductkey:",productKey)

        //***********************dataparsing*******************************
        if(PBConfig.hasOwnProperty(productKey)||POConfig.hasOwnProperty(productKey))
        {
          try {
            //转化为json
            console.log("parsing********")
            // req.payload = (req.topic.operation === 'update') ?
            // controller.tryParseMqttUpdatePayload(payload) :
            // controller.tryParseMqttGetPayload(payload);
            req.payload=JSON.parse(payload)
            
            const payloads = req.payload
            const base64  = payloads.state.reported.payload
            const buff = Buffer.from(base64, 'base64');
            payload = buff.toString('hex');

            req.payload.state.reported = ProtoBuf.ProtoBuf(payload, productKey)//返回js格式
            req.raw.value.payload =JSON.stringify(req.payload);
            console.log("2:",req.raw.value)

            
            // logHandler(req)
            console.log("alright parse****************")
          } catch (err) {
            return resolve()
          }

        } else {
          return resolve()
        }

        // create queue for the new device
        if (!_this._queueCache[did]) {//无此设备，为其创建queue
          _this._queueCache[did] = new Queue();
          _this._queueCache[did].did = did;
          _this._queueCache[did].on('work', queueWorkHandlerWithWatch);//*1*每个设备初次上线，创建queue并监视
        }

        var queue = _this._queueCache[did];

        // check the queue length
        if (queue.length > 10) {//queue长度过长，promise 置为reject，返回error429
          return reject(new Error(429));
        }

        queue.push(req);//*2*将解析后的req放入queue队列，待queueWorkHandler
        if (!queue.isRunning) {//该处理队列未在运行，启动它
          queue.emit('work');
        }

        return resolve();
      })
    }).catch(function (err) {
      // rejectHandler(req, err); // FIXME rejectHandler may be error
      console.log("errror🎃")
      console.log(err);
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
    onReady(dbClient, 'connect'),
    onReady(mqClient, 'connect'),
  ]).then(function () {
    return preStartup();
  }).then(function () {
    // start up

    console.log("*************start*****************")

    mqClient.on('messageParseValue', messageHandlerWithWatch);
    // mqClient.on('messageParseValue', (message) => {
    //   console.log(message)
    // })

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




