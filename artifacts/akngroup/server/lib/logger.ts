import winston from 'winston';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Log Levels (RFC 5424 standartına uygun)
 * 
 * error: 0 - Sistem hatası, acil müdahale gerekli
 * warn:  1 - Potansiyel sorun, dikkat gerekli
 * info:  2 - Normal işletim bilgisi
 * debug: 3 - Detaylı debug bilgisi
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log Context Types
 */
export enum LogContext {
  AUTH = 'auth',
  USER = 'user',
  COMMISSION = 'commission',
  TRANSACTION = 'transaction',
  POOL = 'pool',
  SYSTEM = 'system',
  MIGRATION = 'migration',
  CRON = 'cron',
  API = 'api'
}

/**
 * Log Event Emitter
 * Gerçek zamanlı log dinleme için
 */
export class LogEventEmitter extends EventEmitter {
  emit(event: 'log', level: LogLevel, message: string, meta?: any): boolean {
    return super.emit(event, { level, message, meta, timestamp: new Date() });
  }
}

export const logEventEmitter = new LogEventEmitter();

/**
 * Log Format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console Format (Development için)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, userId, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    if (context) log += ` [${context}]`;
    if (userId) log += ` [${userId}]`;
    log += ` ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

/**
 * Logger Configuration
 */
const loggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || LogLevel.INFO,
  format: logFormat,
  defaultMeta: {
    service: 'mlm-system',
    version: process.env.npm_package_version || '1.0.0'
  }
};

/**
 * Transports
 */
const transports: winston.transport[] = [
  // Console (her zaman)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
];

// File transports (production'da)
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
  
  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: LogLevel.ERROR,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true
    })
  );
}

/**
 * Create Logger
 */
export const logger = winston.createLogger({
  ...loggerOptions,
  transports
});

/**
 * Structured Log Entry
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  userId?: string;
  transactionId?: string;
  correlationId?: string;
  [key: string]: any;
}

/**
 * Logger Service
 * 
 * Production-ready logging service with structured logging support.
 */
export class LoggerService {
  
  /**
   * Error log
   */
  static error(message: string, meta: Partial<LogEntry> = {}): void {
    logger.error(message, meta);
    logEventEmitter.emit('log', LogLevel.ERROR, message, meta);
  }

  /**
   * Warn log
   */
  static warn(message: string, meta: Partial<LogEntry> = {}): void {
    logger.warn(message, meta);
    logEventEmitter.emit('log', LogLevel.WARN, message, meta);
  }

  /**
   * Info log
   */
  static info(message: string, meta: Partial<LogEntry> = {}): void {
    logger.info(message, meta);
    logEventEmitter.emit('log', LogLevel.INFO, message, meta);
  }

  /**
   * Debug log
   */
  static debug(message: string, meta: Partial<LogEntry> = {}): void {
    logger.debug(message, meta);
    logEventEmitter.emit('log', LogLevel.DEBUG, message, meta);
  }

  // ==================== CONTEXT-SPECIFIC LOGGERS ====================

  /**
   * Auth context log
   */
  static auth(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.AUTH, message, meta);
  }

  /**
   * User context log
   */
  static user(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.USER, message, meta);
  }

  /**
   * Commission context log
   */
  static commission(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.COMMISSION, message, meta);
  }

  /**
   * Transaction context log
   */
  static transaction(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.TRANSACTION, message, meta);
  }

  /**
   * Pool context log
   */
  static pool(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.POOL, message, meta);
  }

  /**
   * System context log
   */
  static system(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.SYSTEM, message, meta);
  }

  /**
   * Migration context log
   */
  static migration(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.MIGRATION, message, meta);
  }

  /**
   * Cron context log
   */
  static cron(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.CRON, message, meta);
  }

  /**
   * API context log
   */
  static api(message: string, meta: Partial<LogEntry> = {}): void {
    this.logWithContext(LogLevel.INFO, LogContext.API, message, meta);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Log with context
   */
  private static logWithContext(
    level: LogLevel,
    context: LogContext,
    message: string,
    meta: Partial<LogEntry> = {}
  ): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      ...meta
    };

    switch (level) {
      case LogLevel.ERROR:
        logger.error(message, entry);
        break;
      case LogLevel.WARN:
        logger.warn(message, entry);
        break;
      case LogLevel.INFO:
        logger.info(message, entry);
        break;
      case LogLevel.DEBUG:
        logger.debug(message, entry);
        break;
    }

    logEventEmitter.emit('log', level, message, entry);
  }

  /**
   * Log user action
   */
  static logUserAction(
    userId: string,
    action: string,
    meta: Partial<LogEntry> = {}
  ): void {
    this.user(action, { userId, action, ...meta });
  }

  /**
   * Log transaction
   */
  static logTransaction(
    transactionId: string,
    userId: string,
    amount: number,
    type: string,
    meta: Partial<LogEntry> = {}
  ): void {
    this.transaction(`Transaction ${type}: $${amount}`, {
      transactionId,
      userId,
      amount,
      type,
      ...meta
    });
  }

  /**
   * Log commission distribution
   */
  static logCommission(
    reference: string,
    userId: string,
    amount: number,
    level: number,
    meta: Partial<LogEntry> = {}
  ): void {
    this.commission(`Commission Level ${level}: $${amount}`, {
      reference,
      userId,
      amount,
      level,
      ...meta
    });
  }

  /**
   * Log error with stack trace
   */
  static logError(
    error: Error,
    context: LogContext,
    meta: Partial<LogEntry> = {}
  ): void {
    this.error(error.message, {
      context,
      stack: error.stack,
      name: error.name,
      ...meta
    });
  }

  /**
   * Log performance
   */
  static logPerformance(
    operation: string,
    durationMs: number,
    meta: Partial<LogEntry> = {}
  ): void {
    this.debug(`Performance: ${operation} took ${durationMs}ms`, {
      operation,
      durationMs,
      ...meta
    });
  }
}

/**
 * Express Middleware for Request Logging
 */
export function requestLogger(req: any, res: any, next: () => void): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  // Skip logging for static assets and source files to reduce noise
  const skipLoggingExts = ['.tsx', '.ts', '.jsx', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.json', '.map', '.woff', '.woff2'];
  const isExcludedPath = skipLoggingExts.some(ext => req.originalUrl.includes(ext)) || 
                         req.originalUrl.includes('/node_modules/') || 
                         req.originalUrl.includes('/@vite/') || 
                         req.originalUrl.includes('/@fs/');

  if (isExcludedPath && !req.originalUrl.startsWith('/api/')) {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    if (res.statusCode >= 500) {
      LoggerService.error(`HTTP ${res.statusCode}`, meta);
    } else if (res.statusCode >= 400) {
      LoggerService.warn(`HTTP ${res.statusCode}`, meta);
    } else {
      LoggerService.api(`${req.method} ${req.originalUrl}`, meta);
    }
  });

  req.requestId = requestId;
  next();
}

/**
 * Global Error Handler
 */
export function globalErrorHandler(
  error: Error,
  req: any,
  res: any,
  next: () => void
): void {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params
  };

  LoggerService.logError(error, LogContext.API, meta);

  // Response
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message,
    message: error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    requestId: req.requestId
  });
}

/**
 * Unhandled Rejection Handler
 */
export function handleUnhandledRejection(reason: any, promise: Promise<any>): void {
  LoggerService.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    context: LogContext.SYSTEM
  });
}

/**
 * Unhandled Exception Handler
 */
export function handleUnhandledException(error: Error): void {
  LoggerService.error('Unhandled Exception', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context: LogContext.SYSTEM
  });
}

/**
 * Setup Global Handlers
 */
export function setupGlobalHandlers(): void {
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUnhandledException);
  
  // Graceful shutdown
  const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
  signals.forEach(signal => {
    process.on(signal, () => {
      LoggerService.system(`Received ${signal}, shutting down gracefully...`);
      process.exit(0);
    });
  });
}

export default LoggerService;