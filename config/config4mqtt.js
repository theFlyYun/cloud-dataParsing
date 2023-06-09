var cloudid = '1';
var mqttid = '1';
var fs = require('fs');

module.exports = {
  cluster: {
    worker: 1,
  },

  cloudid: cloudid, //FIXME
  mqttid: mqttid, //FIXME

  cli: {
    enable: false,
    port: 1983, // udp port, could be same as tcp
  },

  // connection
  tcp: { port: '1883' },
  ws: { port: '1885' },
  tls: {

    port: '1885',
    key: fs.readFileSync(`${__dirname}/../keys/server-key.pem`),
    cert: fs.readFileSync(`${__dirname}/../keys/server-cert.pem`),
  },

  // others
  log: {
    level: 'verbose',
  },
  database: [
    {
      'db': 'redis',
      'cluster': false,
      'options': [{ 'host': 'localhost', 'port': '6379' }],
    },
    // {
    //   "db": "mysql",
    //   "username": "yh",
    //   "password": "lbh1234qwer",
    //   "database": "cloud_http_test",
    //   "host": "112.74.85.2",
    //   "dialect": "mysql"
    // }
    {
      'db': 'mysql',
      'username': 'root',
      'password': 'root@aliyun',
      'database': 'cloud_http_server',
      'host': 'localhost',
      'dialect': 'mysql',
      'logging': false,
      'operatorsAliases': false,
      'define': {
        'charset': 'utf8',
        'dialectOptions': {
          'collate': 'utf8_general_ci',
        },
      },
      'pool': {
        'max': 50,
        'min': 10,
        'acquire': 20000,
        'idle': 100000,
      },
    },
  ],

  msgQueue: {
    producer: {
      host: 'localhost:2181',
      clientId: `mqtt-server-${cloudid}`,
      options: {
        requireAcks: 1,
        ackTimeoutMs: 100,
        partitionerType: 2, // default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4
      },
    },
    consumerGroup: {
      topics: [`mqtt-sub-${cloudid}-${mqttid}`],
      options: {
        host: 'localhost:2181',
        groupId: `mqtt-server-${cloudid}`,
        sessionTimeout: 15000,
        protocol: ['roundrobin'],
        fromOffset: 'latest',
        //fromOffset: 'latest',
        //outOfRangeOffset: '',
      },
    },
  },

  hash_method: 'sha256',
  global_salt: '136151389d24369ba28c299252dddaeb00cda5d8ae21429aef324b61e7e7a4ab34ac02d9050d75604e688d247694bb63eeeabfe7d5f3e6b105284553215b4167',

  serviceRegistry: {
    connectionString: 'localhost:2181',
  },

  serviceRegistryKeyMqtt: {
    serviceKey: `${cloudid}:cloudMqttServer:mqtt`,
    providerKey: `${mqttid}:localhost:1883`,
  },

  serviceRegistryKeyGrpc: {
    serviceKey: `${cloudid}:cloudMqttServer:grpc`,
    providerKey: `${mqttid}:localhost:1883`,
  },

  MqttLimit: {    //doesn't use
    windowMs: 5 * 60 * 1000,
    connect: 6,
    subscribe: 10,
    publish: 5,
    unsubscribe: 10,
    pingreq: 1000,
    maxConnectCount: 2000,
    countsEveryPeriod: 20
  },
};
