var ERROR = require('./defines').ERROR;

function CustomError(data) {
  this.name = 'CustomError';

  switch (typeof data) {
    case 'string':
      this.message = data;
      break;
    case 'number':
      this.code = data;
      break;
    case 'object':
      this.code = data.code;
      this.message = data.message;
      break;
    default:
      break;
  }

  this.code = this.code || 500;
  this.message = this.message || ERROR[this.code];

  Error.captureStackTrace(this, CustomError);
}

CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;

module.exports = CustomError;
