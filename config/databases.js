var cloudid = "1";
var loggerid = "1";

module.exports = {
  "databases": [
    {
      "db": "redis",
      "cluster": false,
      "options": [{ "host": "localhost", "port": "6379" }],
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
      "db": "mysql",
      "username": "root",
      "password": "root",
      "database": "cloud_http_server",
      "host": "localhost",
      "dialect": "mysql",
      "logging": false,
      "operatorsAliases": false,
      "define": {
        "charset": "utf8",
        "dialectOptions": {
          "collate": "utf8_general_ci",
        },
      },
      'pool': {
        'max': 50,
        'min': 10,
        'acquire': 20000,
        'idle': 100000,
      },
    },
  ]
}