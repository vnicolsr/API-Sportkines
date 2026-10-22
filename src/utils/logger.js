/**
 * Logger simple compatible con hosting compartido.
 * No usa dependencias externas; escribe a stdout/stderr.
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  debug(msg, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(`[${timestamp()}] [DEBUG] ${msg}`, data ? JSON.stringify(data) : '');
    }
  },
  info(msg, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(`[${timestamp()}] [INFO] ${msg}`, data ? JSON.stringify(data) : '');
    }
  },
  warn(msg, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[${timestamp()}] [WARN] ${msg}`, data ? JSON.stringify(data) : '');
    }
  },
  error(msg, data) {
    console.error(`[${timestamp()}] [ERROR] ${msg}`, data || '');
  }
};

module.exports = { logger };
