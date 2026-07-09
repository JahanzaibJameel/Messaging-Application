/**
 * Logger Service
 * Provides secure logging with Sentry integration and development console output
 */

import { captureException, captureMessage, addUserActionBreadcrumb } from "../monitoring/sentry";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  category?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;
  private maxLogEntries: number;
  private logBuffer: LogEntry[];

  constructor() {
    this.isDevelopment = __DEV__;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    this.maxLogEntries = 1000;
    this.logBuffer = [];
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Keep buffer size limited
    if (this.logBuffer.length > this.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.maxLogEntries);
    }
  }

  /**
   * Format log message for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const category = entry.category ? `[${entry.category}]` : "";

    let message = `${timestamp} ${level} ${category} ${entry.message}`;

    if (entry.data) {
      try {
        const dataString =
          typeof entry.data === "string" ? entry.data : JSON.stringify(entry.data, null, 2);
        message += `\n${dataString}`;
      } catch (error) {
        message += `\n[Data could not be serialized: ${error}]`;
      }
    }

    return message;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, category?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry: LogEntry = {
        level: LogLevel.DEBUG,
        message,
        data,
        timestamp: new Date(),
        category,
      };

      this.addToBuffer(entry);

      if (this.isDevelopment) {
        console.log(this.formatConsoleMessage(entry));
      }
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, category?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry: LogEntry = {
        level: LogLevel.INFO,
        message,
        data,
        timestamp: new Date(),
        category,
      };

      this.addToBuffer(entry);

      if (this.isDevelopment) {
        console.info(this.formatConsoleMessage(entry));
      }
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, category?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry: LogEntry = {
        level: LogLevel.WARN,
        message,
        data,
        timestamp: new Date(),
        category,
      };

      this.addToBuffer(entry);

      // Send warnings to Sentry in production
      if (!this.isDevelopment) {
        captureMessage(message, "warning", data);
      }

      if (this.isDevelopment) {
        console.warn(this.formatConsoleMessage(entry));
      }
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown, category?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message,
        data: error,
        timestamp: new Date(),
        category,
      };

      this.addToBuffer(entry);

      // Send errors to Sentry
      if (error instanceof Error) {
        captureException(error, {
          action: "logger_error",
          screen: category || "unknown",
          additionalData: { message },
        });
      } else {
        captureMessage(message, "error", error as Record<string, unknown> | undefined);
      }

      if (this.isDevelopment) {
        console.error(this.formatConsoleMessage(entry));
      }
    }
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error | any, category?: string): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const entry: LogEntry = {
        level: LogLevel.FATAL,
        message,
        data: error,
        timestamp: new Date(),
        category,
      };

      this.addToBuffer(entry);

      // Send fatal errors to Sentry with highest priority
      if (error instanceof Error) {
        captureException(error, {
          action: "logger_fatal",
          screen: category || "unknown",
          additionalData: { message, isFatal: true },
        });
      } else {
        captureMessage(message, "fatal", error);
      }

      if (this.isDevelopment) {
        console.error(this.formatConsoleMessage(entry));
      }
    }
  }

  /**
   * Check if message should be logged based on current log level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.level === level);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.category === category);
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Create breadcrumb for user action
   */
  breadcrumb(message: string, data?: any, category?: string): void {
    addUserActionBreadcrumb(message, {
      category: category || "user_action",
      ...data,
    });
  }

  /**
   * Performance logging
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }

    this.breadcrumb("timer_start", { label }, "performance");
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }

    this.breadcrumb("timer_end", { label }, "performance");
  }

  /**
   * Network request logging
   */
  networkRequest(url: string, method: string, statusCode?: number, duration?: number): void {
    const message = `${method} ${url}`;
    const data = {
      url,
      method,
      statusCode,
      duration,
    };

    if (statusCode && statusCode >= 400) {
      this.error(message, data, "network");
    } else {
      this.info(message, data, "network");
    }
  }

  /**
   * User interaction logging
   */
  userInteraction(action: string, element?: string, data?: any): void {
    const message = `User ${action}`;
    const interactionData = {
      action,
      element,
      ...data,
    };

    this.info(message, interactionData, "user_interaction");
    this.breadcrumb(message, interactionData);
  }

  /**
   * Security event logging
   */
  security(event: string, data?: any): void {
    const message = `Security: ${event}`;

    // Always log security events
    this.warn(message, data, "security");

    // Send to Sentry as well
    captureMessage(message, "warning", {
      securityEvent: true,
      ...data,
    });
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export convenience functions
export const debug = (message: string, data?: any, category?: string) =>
  logger.debug(message, data, category);
export const info = (message: string, data?: any, category?: string) =>
  logger.info(message, data, category);
export const warn = (message: string, data?: any, category?: string) =>
  logger.warn(message, data, category);
export const error = (message: string, err?: Error | any, category?: string) =>
  logger.error(message, err, category);
export const fatal = (message: string, err?: Error | any, category?: string) =>
  logger.fatal(message, err, category);

// Export additional functions
export const breadcrumb = (message: string, data?: any, category?: string) =>
  logger.breadcrumb(message, data, category);
export const time = (label: string) => logger.time(label);
export const timeEnd = (label: string) => logger.timeEnd(label);
export const networkRequest = (
  url: string,
  method: string,
  statusCode?: number,
  duration?: number
) => logger.networkRequest(url, method, statusCode, duration);
export const userInteraction = (action: string, element?: string, data?: any) =>
  logger.userInteraction(action, element, data);
export const security = (event: string, data?: any) => logger.security(event, data);

// Export logger instance and class
export { logger };
export default logger;
