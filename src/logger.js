// src/logger.js

function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info(...args) {
    console.log(`[${timestamp()}] [INFO]`, ...args);
  },
  warn(...args) {
    console.warn(`[${timestamp()}] [WARN]`, ...args);
  },
  error(...args) {
    console.error(`[${timestamp()}] [ERROR]`, ...args);
  },
  debug(...args) {
    if (process.env.DEBUG) {
      console.log(`[${timestamp()}] [DEBUG]`, ...args);
    }
  }
};

export function requestLogger(req, res, next) {
  const start = Date.now();
  logger.info(`Incoming ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const ms = Date.now() - start;
    logger.info(
      `Completed ${req.method} ${req.originalUrl} with status ${res.statusCode} in ${ms}ms`
    );
  });

  next();
}
