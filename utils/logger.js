/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(serviceName = 'Belleful') {
    this.serviceName = serviceName;
    this.level = process.env.LOG_LEVEL ? 
      LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO : 
      LOG_LEVELS.INFO;
  }

  // Format log message with timestamp and metadata
  formatLog(level, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level,
      message,
      ...metadata,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Log to console (production might use external service)
  output(logObj) {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logObj));
    } else {
      console.log(`[${logObj.timestamp}] ${logObj.level} - ${logObj.message}`, logObj);
    }
  }

  debug(message, metadata = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      this.output(this.formatLog('DEBUG', message, metadata));
    }
  }

  info(message, metadata = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      this.output(this.formatLog('INFO', message, metadata));
    }
  }

  warn(message, metadata = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      this.output(this.formatLog('WARN', message, metadata));
    }
  }

  error(message, error = null, metadata = {}) {
    const errorData = {
      ...metadata,
      error: error?.message || error,
      ...(process.env.NODE_ENV === 'development' && error?.stack && { stack: error.stack })
    };
    this.output(this.formatLog('ERROR', message, errorData));
  }

  // Log API requests
  logRequest(method, path, statusCode, duration, metadata = {}) {
    this.info(`${method} ${path}`, {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Log database operations
  logDatabase(operation, collection, duration, metadata = {}) {
    this.debug(`DB: ${operation} on ${collection}`, {
      operation,
      collection,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Log authentication events
  logAuth(event, userId, metadata = {}) {
    this.info(`Auth: ${event}`, {
      event,
      userId,
      ...metadata
    });
  }

  // Log payment events
  logPayment(event, orderId, amount, metadata = {}) {
    this.info(`Payment: ${event}`, {
      event,
      orderId,
      amount,
      ...metadata
    });
  }

  // Log order events
  logOrder(event, orderId, metadata = {}) {
    this.info(`Order: ${event}`, {
      event,
      orderId,
      ...metadata
    });
  }
}

// Export singleton instance
module.exports = new Logger('Belleful');
