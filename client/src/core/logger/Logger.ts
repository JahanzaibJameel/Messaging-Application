/**
 * Production Logger
 * Enterprise-grade logging with levels, filtering, and performance tracking
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
  userId?: string;
  sessionId: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
  sampleRate: number;
  maxBufferSize: number;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: __DEV__ ? 'debug' : 'info',
      enableConsole: true,
      enableRemote: false,
      sampleRate: 1.0,
      maxBufferSize: 100,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Add to buffer
    this.buffer.push(entry);
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer.shift();
    }

    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteUrl) {
      this.sendToRemote(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const context = entry.context ? ` [${entry.context}]` : '';
    const fullMessage = `${prefix}${context}: ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage, entry.data ?? '');
        break;
      case 'info':
        console.info(fullMessage, entry.data ?? '');
        break;
      case 'warn':
        console.warn(fullMessage, entry.data ?? '');
        break;
      case 'error':
      case 'fatal':
        console.error(fullMessage, entry.data ?? '', entry.error ?? '');
        break;
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (Math.random() > this.config.sampleRate) return;

    try {
      await fetch(this.config.remoteUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // Silent fail for remote logging
    }
  }

  // Public API
  debug(message: string, context?: string, data?: unknown): void {
    this.log(this.createEntry('debug', message, context, data));
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log(this.createEntry('info', message, context, data));
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log(this.createEntry('warn', message, context, data));
  }

  error(message: string, error?: Error, context?: string, data?: unknown): void {
    this.log(this.createEntry('error', message, context, data, error));
  }

  fatal(message: string, error?: Error, context?: string, data?: unknown): void {
    this.log(this.createEntry('fatal', message, context, data, error));
  }

  // Performance tracking
  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`Timer [${label}]: ${duration.toFixed(2)}ms`, 'Performance');
    };
  }

  // Get buffered logs
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  // Clear buffer
  clearBuffer(): void {
    this.buffer = [];
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const logDebug = (message: string, context?: string, data?: unknown) =>
  logger.debug(message, context, data);
export const logInfo = (message: string, context?: string, data?: unknown) =>
  logger.info(message, context, data);
export const logWarn = (message: string, context?: string, data?: unknown) =>
  logger.warn(message, context, data);
export const logError = (message: string, error?: Error, context?: string, data?: unknown) =>
  logger.error(message, error, context, data);
export const logFatal = (message: string, error?: Error, context?: string, data?: unknown) =>
  logger.fatal(message, error, context, data);
