'use strict';

const _ = require('lodash');
const debug = require('debug')('deviceShadow:CallWatcherHelper');
const cloudLib = require('cloud-lib');
const CallWatcher = cloudLib.CallWatcher;

class CallWatcherHelper {

  constructor() {
    let _this = this;
    if (CallWatcherHelper.isDebug()) {
      this._callInfo = {};
      this._callWatcher = new CallWatcher();
      this._callWatcher.on(CallWatcher.EVENT.CALL_RETURN, info => {//CallWatcher.EVENT.CALL_RETURN事件触发
        let callInfo = _this._callInfo;
        let funcName = info.funcName;
        let time = info.hrtimeMsDiff;

        if (!callInfo[funcName]) {//表中元素为结构体，初始化该元素
          callInfo[funcName] = {
            count: 0,
            totalTime: 0,
            avgTime: 0,
          };
        }

        let funcInfo = callInfo[funcName];
        funcInfo.count++;
        funcInfo.totalTime += time;
        funcInfo.avgTime = funcInfo.count ? funcInfo.totalTime / funcInfo.count : 0;//计算更新funcInfo中对象
      });

      setInterval(() => {
        let callInfoForLog = Object.keys(_this._callInfo)//返回_callInfo 的键值（funcname）组成的数组（升序）
          .map(funcName => _.assign({ name: funcName }, _this._callInfo[funcName]))
          //map() 方法返回一个新数组，数组中的元素为原始数组元素调用函数处理后的值
          //map用结构体替换原本的funcName，结构体中包含name,count,totalTime,avgTime信息
          .sort((a, b) => b.avgTime - a.avgTime);//根据avgtime降序排列
        debug('callInfo', JSON.stringify(callInfoForLog));
        _this._callInfo = {};
      }, 60000);//每6秒执行？记录一次日志
    }
  }

  createWatchCallsObject(objectName, object) {
    if (!CallWatcherHelper.isDebug()) {
      return object;
    }
    return this._callWatcher.watchObject(objectName, object);
  }

  createWatchCallsFunc(funcName, func) {
    if (!CallWatcherHelper.isDebug()) {
      return func;
    }
    return this._callWatcher.watchFunc(funcName, func);
  }

  static getInstance() {
    return CallWatcherHelper.INSTANCE;
  }

  static isDebug() {
    let DEBUG = process.env.DEBUG;
    return DEBUG === '*' || DEBUG === 'deviceShadow:CallWatcherHelper';
  }
}

CallWatcherHelper.INSTANCE = new CallWatcherHelper();

module.exports = CallWatcherHelper;
