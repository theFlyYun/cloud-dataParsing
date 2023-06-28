module.exports = {
  pb: {
    "dc6ed37dca2e99ca79213e45bd1a1662": "payload.Message",
    "5015939e65676d9e72959050fd31349e": ["soil.SoilMessage", "soil"],
  },
  productkey2object: {
    "1b313f4449a637bbbe8ed40c643a691a":"soil.json",//测试用
    "74139f8ab541edb7a12a13eaeebaeada": "soil.json",//测试用
    "e5e62f0f99c35f66b61b49b442d931d9": "soil.json",
    "9c39233074709272faa46814eae7ebca": "soil.json",
    "d085cb65d9df829b76611b49a4a7fe06": "weather.json",
    "87736609cdc730c562da44d24d4c3c25":"weather.json",//测试用
  },
  connect: {
    host: "http://8.142.81.91:1883",
    username: "lyf_dataparsing",
    uid: "U915f0c3e0729b39095ee139843e0a7c",
    password: "2023414",
    options: {
      keepalive: 60,
      clientId: "mqttjs_" + Math.random().toString(16).substr(2, 8),
      protocolId: "MQTT",
      protocolVersion: 3,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      username: "lyf_dataparsing",
      password: "2023414",
    },
  },
  "logger": {
    "level": "debug",
  },
  "msgQueue": {
    "mq": "redis",
    "cluster": false,
    "options": [{ "host": "localhost", "port": "6379" }],
  },
};
