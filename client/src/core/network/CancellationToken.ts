/**
 * Cancellation Token
 * Standardized cancellation pattern for async operations
 */

export class CancellationError extends Error {
  constructor(message = 'Operation was cancelled') {
    super(message);
    this.name = 'CancellationError';
  }
}

export class CancellationToken {
  private _isCancelled = false;
  private _reason?: string;
  private listeners: Set<() => void> = new Set();

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  /**
   * Cancel the operation
   */
  cancel(reason?: string): void {
    if (this._isCancelled) return;
    
    this._isCancelled = true;
    this._reason = reason;
    
    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Ignore listener errors
      }
    });
    
    this.listeners.clear();
  }

  /**
   * Throw if cancelled
   */
  throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new CancellationError(this._reason);
    }
  }

  /**
   * Register a callback for cancellation
   */
  onCancelled(callback: () => void): () => void {
    if (this._isCancelled) {
      callback();
      return () => {};
    }
    
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Create a linked token that cancels when either token cancels
   */
  static link(...tokens: CancellationToken[]): CancellationToken {
    const linked = new CancellationToken();
    
    tokens.forEach((token) => {
      token.onCancelled(() => {
        linked.cancel(`Linked token cancelled: ${token.reason || 'No reason'}`);
      });
    });
    
    return linked;
  }
}

/**
 * Create a cancellation token with timeout
 */
export function withTimeout(ms: number, reason = 'Operation timed out'): CancellationToken {
  const token = new CancellationToken();
  
  const timeoutId = setTimeout(() => {
    token.cancel(reason);
  }, ms);
  
  // Clean up timeout if cancelled externally
  token.onCancelled(() => {
    clearTimeout(timeoutId);
  });
  
  return token;
}

/**
 * Wrap a promise with cancellation support
 */
export async function withCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken
): Promise<T> {
  token.throwIfCancelled();
  
  return new Promise((resolve, reject) => {
    const unsubscribe = token.onCancelled(() => {
      reject(new CancellationError(token.reason));
    });
    
    promise
      .then((result) => {
        unsubscribe();
        resolve(result);
      })
      .catch((error) => {
        unsubscribe();
        reject(error);
      });
  });
}

/**
 * Hook for React components
 */
export function useCancellationToken(): {
  token: CancellationToken;
  cancel: (reason?: string) => void;
} {
  const token = new CancellationToken();
  
  return {
    token,
    cancel: (reason?: string) => token.cancel(reason),
  };
}
