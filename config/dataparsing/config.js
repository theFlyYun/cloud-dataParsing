module.exports = {
  pb: {
    "dc6ed37dca2e99ca79213e45bd1a1662": "payload.Message",
    "5015939e65676d9e72959050fd31349e": ["soil.SoilMessage", "soil"],
  },
  productkey2object: {
    "74139f8ab541edb7a12a13eaeebaeada": "soil.json",
    "e5e62f0f99c35f66b61b49b442d931d9": "soil.json",
    "9c39233074709272faa46814eae7ebca": "soil.json",
    "1b313f4449a637bbbe8ed40c643a691a": "weather.json",
  },
  connect: {
    host: "http://8.142.81.91:1883",
    username: "lyf20230303",
    uid: "U915f0c3e0729b39095ee139843e0a7c",
    password: "20230303",
    options: {
      keepalive: 60,
      clientId: "mqttjs_" + Math.random().toString(16).substr(2, 8),
      protocolId: "MQTT",
      protocolVersion: 3,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      username: "U915f0c3e0729b39095ee139843e0a7c",
      password: "20230303",
    },
  },
  "logger": {
    "level": "debug",
  },
};
