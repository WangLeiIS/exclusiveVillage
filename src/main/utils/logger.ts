let logger: any = null;

function getLogger() {
  if (!logger) {
    const { logger: loggerInstance } = require('../../utils/Logger.js');
    logger = loggerInstance;
  }
  return logger;
}

module.exports = { getLogger };
