module.exports = {
  "msgQueue": {
    "mq": "redis",
    "cluster": false,
    "options": [{ "host": "localhost", "port": "6379" }],
  },
  "operation": "update",
  "did": "aaaabbbbcccc",
  "concurrency": 1,
  "payload": {
    //version: 8,
    "state": {
      //reported: {
      //  rgb: 666,
      //  onoff: true,
      //},
      "desired": {
        "rgb": 123,
        "onoff": false,
        "custom": {
          "name": "nick",
          "icon": [1, 2, 3, 4]
        },
        "array": null,
      },
    },
  },
};
