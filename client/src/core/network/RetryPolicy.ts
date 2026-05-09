/**
 * Retry Policy
 * Exponential backoff with jitter for resilient network operations
 */

import { logger } from "../logger";

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMITED", "SERVER_ERROR"],
};

export interface RetryContext {
  attempt: number;
  lastError?: Error;
  startTime: number;
}

export type RetryableOperation<T> = (context: RetryContext) => Promise<T>;

export class RetryPolicy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(operation: RetryableOperation<T>, operationName: string): Promise<T> {
    const context: RetryContext = {
      attempt: 0,
      startTime: Date.now(),
    };

    while (context.attempt < this.config.maxAttempts) {
      context.attempt++;

      try {
        const result = await operation(context);

        if (context.attempt > 1) {
          logger.info(`Operation succeeded after ${context.attempt} attempts`, "RetryPolicy", {
            operation: operationName,
            duration: Date.now() - context.startTime,
          });
        }

        return result;
      } catch (error) {
        context.lastError = error instanceof Error ? error : new Error(String(error));

        const shouldRetry = this.shouldRetry(error, context.attempt);

        if (!shouldRetry) {
          logger.error(
            `Operation failed permanently after ${context.attempt} attempts`,
            context.lastError,
            "RetryPolicy",
            { operation: operationName }
          );
          throw context.lastError;
        }

        const delay = this.calculateDelay(context.attempt);

        logger.warn(`Attempt ${context.attempt} failed, retrying in ${delay}ms`, "RetryPolicy", {
          operation: operationName,
          error: context.lastError.message,
        });

        await this.sleep(delay);
      }
    }

    throw context.lastError || new Error("Max retry attempts exceeded");
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    if (!(error instanceof Error)) {
      return true; // Retry unknown errors
    }

    // Check if error message contains retryable keywords
    const errorMessage = error.message.toUpperCase();
    return this.config.retryableErrors.some((retryable) => errorMessage.includes(retryable));
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: baseDelay * multiplier^(attempt-1)
    const exponentialDelay =
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * this.config.jitterFactor * (Math.random() * 2 - 1);
    const finalDelay = Math.max(0, cappedDelay + jitter);

    return Math.round(finalDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance with default config
export const defaultRetryPolicy = new RetryPolicy();

// Convenience function
export async function withRetry<T>(
  operation: RetryableOperation<T>,
  operationName: string,
  config?: Partial<RetryConfig>
): Promise<T> {
  const policy = config ? new RetryPolicy(config) : defaultRetryPolicy;
  return policy.execute(operation, operationName);
}
