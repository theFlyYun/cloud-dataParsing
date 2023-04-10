'use strict';

const _ = require('lodash');
const util = require('util');
const cloudLib = require('cloud-lib');
const AppMonitor = cloudLib.appMonitor.AppMonitor;
const collectFunctions = cloudLib.appMonitor.collectFunctions;
const cloudLibUtils = cloudLib.utils;

const config = require('../../config');
const shadowid = config.shadowid;

const emptyData = () => ({
  fromKafkaBytes: 0,
  toKafkaBytes: 0,
  fromKafkaMessageCount: 0,
  toKafkaMessageCount: 0,
  requestCount: 0,
  responseTime: 0.00,
  avgResponseTime: 0.00,
  cpuUsage: 0.00,
  memUsage: 0.00,
});

const formatData = data => {
  if (!data) {
    return data;
  }
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let value = data[key];
      if (_.isNumber(value)) {
        data[key] = parseFloat(value.toFixed(2));
      }
    }
  }
  return data;
};

class AppMonitorHelper {
  constructor() {
    let _this = this;
    const appMonitor = new AppMonitor({
      dumpInterval: 2 * 60,//重置时间
      dumpFunction: function (data) {
        formatData(data);
        console.log(JSON.stringify(data));
        let dumpData = _.omit(_.isEmpty(data) ? emptyData() : data, 'responseTime');//省略“反应时间”
        _this.dbClient._ioredis.set(`cloudDeviceShadow:${shadowid}`, JSON.stringify(dumpData));//存储在库中
        appMonitor.data = emptyData(); //每2min重置监视器数据
      },

      collectInterval: 2 * 60,
      collectFunctions: {
        cpuUsage: collectFunctions.cpuCollectFunc(process.pid),
        memUsage: collectFunctions.memCollectFunc(process.pid),
      },
    });
    appMonitor.data = emptyData();
    this.appMonitor = appMonitor;
    this.started = false;
  }

  start(dbClient) {
    if (!dbClient) {//输入非法
      throw new Error('illegal param: dbClient can not be null');
    }
    if (this.started) {//监视器
      return;
    }
    this.dbClient = dbClient;
    let appMonitor = this.appMonitor;
    appMonitor.pcollect();//以`collectInterval`为周期调用AppMonitor#collect
    setTimeout(() => {
      appMonitor.pdump();//以`dumpInterval`为周期调用AppMonitor#dump
    }, 2000);//延时两秒后
    this.started = true;
  }

  onReqsProcessed(reqs) {
    if (!this.started) {
      return;
    }
    let appMonitor = this.appMonitor;
    var requestCount = appMonitor.get('requestCount') + reqs.length;//更新请求数量
    var responseTime = appMonitor.get('responseTime');
    reqs.forEach(req => {
      responseTime += cloudLibUtils.getHrtimeMsDiff(req.hrtime);//累加计算反应时间
    });
    appMonitor.update('requestCount', requestCount);
    appMonitor.update('responseTime', responseTime);//更新监视器data
    appMonitor.update('avgResponseTime', parseFloat((responseTime / requestCount).toFixed(2)));//计算平均反应时间
  }

  onKafkaReqsSent(produceRequests) {
    if (!this.started || !produceRequests) {//监视器未开启 或 输入为空
      return;
    }
    let appMonitor = this.appMonitor;
    let size = cloudLibUtils.calculateBytesFromProduceRequests(produceRequests).total;//数据总字节
    let count = cloudLibUtils.calculateMessageCountFromProduceRequests(produceRequests).total;//消息条数
    appMonitor.update('toKafkaBytes', appMonitor.get('toKafkaBytes') + size);
    appMonitor.update('toKafkaMessageCount', appMonitor.get('toKafkaMessageCount') + count);//更新
  }

  onKafkaMessageReceive(message) {
    if (!this.started || !message) {//监视器未开启 或 输入为空
      return;
    }
    let appMonitor = this.appMonitor;
    let size = cloudLibUtils.getStringSize(message.value);//消息长度
    appMonitor.update('fromKafkaBytes', appMonitor.get('fromKafkaBytes') + size);
    appMonitor.update('fromKafkaMessageCount', appMonitor.get('fromKafkaMessageCount') + 1);//更新
  }

  isStarted() {
    return this.started;
  }

  static getInstance() {
    return AppMonitorHelper.INSTANCE;
  }
}

AppMonitorHelper.INSTANCE = new AppMonitorHelper();

module.exports = AppMonitorHelper;
