module.exports = {
  "database": {
    "db": "redis",
    "cluster": true,
    "options": [{ "host": "localhost", "port": "6379" }],
  },
  "msgQueue": {
    "mq": "redis",
    "cluster": false,
    "options": [{ "host": "localhost", "port": "6379" }],
  },
  "logger": {
    "level": "info",
  },
};
