/*
 * @Author: Long Yunfei
 * @Date: 2023-04-11 00:10:47
 * @LastEditTime: 2023-04-11 09:32:52
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: 
 */
var dataParsing = require('../index');
var config = require('../config');

var data_parsing = new dataParsing(config);

process.on('SIGINT', function () {//监听服务器运行过程中出现错误
    data_parsing.close().then(function () {
    console.log('close done')
  })
});