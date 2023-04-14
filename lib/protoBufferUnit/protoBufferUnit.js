/*
 * @Author: Long Yunfei
 * @Date: 2023-04-10 23:45:45
 * @LastEditTime: 2023-04-14 08:56:00
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: 
 */
const config = require('../../config/dataparsing/config');
const PBConfig = config.pb;
const protobuf = require('protobufjs');
const fs = require('fs');
const protoFilePath = '../../config/dataparsing/pbconfig/';
const path = require('path');

const root = protobuf.Root.fromJSON(require("../../config/dataparsing/pbconfig/protobufConfig.json"));
const payloaddecode = require('../utils/payloadDecode')

const opt = require("../../config/dataparsing/config").logger;
const createLogger=require('../logger')
const logger = new createLogger(opt);
 
exports.ProtoBuf = PBtoJSON;

function Datahandle(productKey,output)
{
   var folder_name = PBConfig[productKey][1]
   folder_path = protoFilePath + folder_name+'.json'
   var jsonconfig = require(folder_path)
    for(key in jsonconfig){
        var obj = jsonconfig[key]
        if(obj.hasOwnProperty('divisor')&&output[key]!=null)
        {
          output[key] = output[key]/obj.divisor;
        }
    }
    return output
}

function PBtoJSON (payload, productKey) {
 
  if (PBConfig.hasOwnProperty(productKey))
  {
    let deviceType = PBConfig[productKey][0];
    let messageType = root.lookupType(deviceType);
    var buffer =  Buffer.from(payload, 'hex')
    var mess = messageType.decode(buffer);
    var output = messageType.toObject(mess,{
      enums:String,
      longs:String,
      bytes:String,
      defaults: false,  
      arrays: false,   
      objects: false,  
      oneofs: false,
    });

    output = Datahandle(productKey,output)
    output.payload_len = payload.length/2
  }
  else if(config.productkey2object.hasOwnProperty(productKey)){
   var output = payloaddecode.rawdata2JS(payload, productKey)
  }
  else{
    logger.error(`productKey:${productKey} can not found in config`)
  }

  var obj = {
    state:{reported:output},
  };

  //转为json
  logger.debug(obj)
  var messagejson = JSON.stringify(output,"","\t");
  // console.log(messagejson)
  
  return output
}
 
