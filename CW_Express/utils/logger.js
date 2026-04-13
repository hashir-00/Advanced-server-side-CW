/**
 * Simple Logger Utility
 * Provides standardized logging for different application levels
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (level, moduleName, message, data = '') => {
    console.log(`[${getTimestamp()}] INFO [${level}] [${moduleName}] ${message}`, data ? data : '');
  },
  
  error: (level, moduleName, message, error) => {
    console.error(`[${getTimestamp()}] ERROR [${level}] [${moduleName}] ${message}`);
    if (error) {
      console.error(error);
    }
  },

  // Level specific helpers
  controller: {
    info: (moduleName, message, data) => logger.info('CONTROLLER', moduleName, message, data),
    error: (moduleName, message, error) => logger.error('CONTROLLER', moduleName, message, error)
  },
  
  service: {
    info: (moduleName, message, data) => logger.info('SERVICE', moduleName, message, data),
    error: (moduleName, message, error) => logger.error('SERVICE', moduleName, message, error)
  },
  
  repo: {
    info: (moduleName, message, data) => logger.info('REPO', moduleName, message, data),
    error: (moduleName, message, error) => logger.error('REPO', moduleName, message, error)
  }
};

module.exports = logger;
