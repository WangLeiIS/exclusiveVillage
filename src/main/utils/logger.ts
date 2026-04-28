let logger: any = null;

export function getLogger() {
  if (!logger) {
    const { logger: loggerInstance } = require('../../utils/Logger.js');
    logger = loggerInstance;
  }
  return logger;
}
