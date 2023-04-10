const config = require('../config/dataparsing/config');
const ProtoBuf = require('./protoBufferUnit/protoBufferUnit');
const _=require('./utils/getlist');

const opt = require("../config/dataparsing/config").logger;
const createLogger=require('./logger')
const logger = new createLogger(opt);

var mqtt = require('mqtt');
// const { PBtoJSON } = require('../lib/protoBufferUnit');
const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
var did2product_key;

console.log('Connecting mqtt client')
 
const client = mqtt.connect(config.connect.host, config.connect.options)

client.on('connect', () => {
  console.log('Client connected:' + clientId)
  _.getlist().then(did2PK=>{
    did2product_key=did2PK
    for(key in did2PK){
      client.subscribe(`$rlwio/devices/${key}/shadow/update/accepted`, { qos: 0 })
      logger.debug(`${key} has subscribed`)
    }

  })
})

client.on('error', (err) => {
  console.log('Connection error: ', err)
  logger.error(`${err}`)
  client.end()
}) 

client.on('reconnect', () => {
  console.log('Reconnecting...')
  logger.debug(`reconnect`)
})

client.on('message', (topic, message, packet) => {
  // console.log("message receive from",topic)
  var did=topic.slice(15,37)

  // logger.debug(message.toString())
 
  var product_key=did2product_key[did]
  var payload
  try{
    var JS_origin_message=JSON.parse(message.toString())

    if(JS_origin_message.state.reported.payload!=undefined){

      logger.debug(message.toString())
      const base64  = JS_origin_message.state.reported.payload
      const buff = Buffer.from(base64, 'base64');
      payload = buff.toString('hex');

      const messagejson = ProtoBuf.ProtoBuf(payload,product_key)
  
      client.publish(`$rlwio/devices/${did}/shadow/update`, messagejson)
      // logger.debug(messagejson.toString())
    }
    else{
      // logger.debug(message.toString())
    }
  }
  catch(err){
    logger.error(`${err}`)
  }
})
