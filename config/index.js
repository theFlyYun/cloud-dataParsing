var config;

/* load from config file */
switch (process.env.NODE_ENV) {
  case 'development':
    config = require('./development');
  break;

  case 'production':
    config = require('./production');
  break;

  default:
    config = require('./development');
  break;
}

/* TODO overwrite by env */
/* TODO overwrite by cli */

module.exports = config;
