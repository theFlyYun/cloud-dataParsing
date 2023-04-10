/* logger singleton */
var winston = require('winston');
var moment = require('moment');
var _ = require('lodash');
var logger;

var defaultOptions = {
  level: 'silly',
  colorize: false,
  humanReadable: false,
};

function createLogger(opts) {
  if (!logger) {
    opts = _.defaults(opts, defaultOptions);
    var space = opts.humanReadable ? 2 : null;
    logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          level: opts.level,
          colorize: opts.colorize,
          timestamp: function () {
            return moment().format();
          },

          formatter: function (options) {
            return options.level.toUpperCase() + ': ' + options.timestamp() + ' ' +
              (options.message ? options.message + ' ' : '') +
              (options.meta && Object.keys(options.meta).length ?
               JSON.stringify(options.meta, null, space) : '');
          },
        }),
      ],
    });
  }

  return logger;
}

module.exports = createLogger;
