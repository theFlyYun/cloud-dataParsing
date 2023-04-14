/*
 * @Author: Long Yunfei
 * @Date: 2023-04-10 23:10:29
 * @LastEditTime: 2023-04-13 21:30:37
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: 
 */
var cloudid = '1';
var shadowid = '1';

module.exports = {
  cloudid: cloudid,
  shadowid: shadowid,
  database: {
    db: 'redis',
    cluster: false,
    options: [{ 'host': '172.31.165.72', 'port': '6379' }],
  },
  logger: {
    level: 'debug',
  },
  msgQueue: {
    producer: {
      host: '172.31.165.72:2181',
      // clientId: `device-shadow-${cloudid}`,
      clientId: `data-parsing-${cloudid}`,
      options: {
        requireAcks: 1,
        ackTimeoutMs: 100,
        partitionerType: 2, // default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4
      },
    },
    consumerGroup: {
      topics: [
        `mqtt-pub-${cloudid}`,
        `http-pub-${cloudid}`,
      ],
      options: {
        host: '172.31.165.72:2181',
        // groupId: `device-shadow-${cloudid}`,
        groupId: `data-parsing-${cloudid}`,
        sessionTimeout: 15000,
        protocol: ['roundrobin'],
        fromOffset: 'latest',
        //fromOffset: 'latest',
        //outOfRangeOffset: '',
      }
    }
  },
  serviceRegistry: {
    connectionString: '172.31.165.72:2181',
  },

  serviceRegistryKey: {
    serviceKey: `${cloudid}:cloudDeviceShadow:-1`,
    providerKey: `${shadowid}:172.31.165.71:-1`,
  },
};
