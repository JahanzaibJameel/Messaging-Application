/**
 * Base application error class
 */

export type ErrorCode =
  | "UNKNOWN_ERROR"
  | "NETWORK_ERROR"
  | "AUTH_ERROR"
  | "VALIDATION_ERROR"
  | "STORAGE_ERROR"
  | "SYNC_ERROR"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED";

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly originalError?: Error;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "AppError";
    this.code = details.code;
    this.originalError = details.originalError;
    this.context = details.context;
    this.timestamp = new Date();

    // Maintain proper stack trace (V8 environments)

    const ErrorConstructor = Error as unknown as {
      captureStackTrace?: (target: Error, constructor: unknown) => void;
    };
    if (typeof ErrorConstructor.captureStackTrace === "function") {
      ErrorConstructor.captureStackTrace(this, AppError);
    }
  }

  static network(message = "Network error occurred", originalError?: Error): AppError {
    return new AppError({
      code: "NETWORK_ERROR",
      message,
      originalError,
    });
  }

  static auth(message = "Authentication error", originalError?: Error): AppError {
    return new AppError({
      code: "AUTH_ERROR",
      message,
      originalError,
    });
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError({
      code: "VALIDATION_ERROR",
      message,
      context,
    });
  }

  static storage(message = "Storage error", originalError?: Error): AppError {
    return new AppError({
      code: "STORAGE_ERROR",
      message,
      originalError,
    });
  }

  static sync(message = "Sync error", originalError?: Error): AppError {
    return new AppError({
      code: "SYNC_ERROR",
      message,
      originalError,
    });
  }

  static notFound(resource: string): AppError {
    return new AppError({
      code: "NOT_FOUND",
      message: `${resource} not found`,
    });
  }

  static media(message = "Media processing error", originalError?: Error): AppError {
    return new AppError({
      code: "UNKNOWN_ERROR",
      message,
      originalError,
    });
  }

  static permission(message = "Permission denied"): AppError {
    return new AppError({
      code: "PERMISSION_DENIED",
      message,
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      code: "UNKNOWN_ERROR",
      message: error.message,
      originalError: error,
    });
  }

  return new AppError({
    code: "UNKNOWN_ERROR",
    message: String(error),
  });
}

/**
 * Async function wrapper with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const appError = handleError(error);

    if (errorHandler) {
      errorHandler(appError);
    } else {
      // Import logger dynamically to avoid circular dependency
      import("../logger")
        .then(({ logger }) => {
          logger.error("Unhandled application error", appError, "AppError");
        })
        .catch(() => {
          // Fallback if logger fails
          console.error("[AppError]", appError);
        });
    }

    return undefined;
  }
}

/**
 * Safe async operation with error handling and logging
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, unknown>
): Promise<{ success: boolean; result?: T; error?: AppError }> {
  try {
    const result = await operation();
    return { success: true, result };
  } catch (error) {
    const appError = handleError(error);

    // Log the error with context
    import("../logger")
      .then(({ logger }) => {
        logger.error(`Operation failed: ${operationName}`, appError, "AppError", {
          context,
          error: appError.message,
        });
      })
      .catch(() => {
        console.error(`[${operationName}]`, appError);
      });

    return { success: false, error: appError };
  }
}
