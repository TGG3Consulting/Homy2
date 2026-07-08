type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const logger = {
  log(level: LogLevel, message: string, meta?: object) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      console[level](entry);
    }
  },
  debug: (msg: string, meta?: object) => logger.log('debug', msg, meta),
  info: (msg: string, meta?: object) => logger.log('info', msg, meta),
  warn: (msg: string, meta?: object) => logger.log('warn', msg, meta),
  error: (msg: string, meta?: object) => logger.log('error', msg, meta),
};

export default logger;
