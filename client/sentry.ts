/**
 * Sentry configuration for crash monitoring and error tracking
 */

import * as Sentry from "@sentry/react-native";

// Initialize Sentry with your DSN (replace with actual DSN in production)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || "https://your-dsn@sentry.io/project-id";

export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? "development" : "production",
    enableAutoSessionTracking: true,
    // Performance monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
    // Session replay
    _experiments: {
      // The sampling rate for session replay is relative to the tracesSampleRate
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    },
    beforeSend(event) {
      // Filter out certain errors in development
      if (__DEV__) {
        // Don't send console errors in development
        if (event.exception?.values?.[0]?.value?.includes("console.error")) {
          return null;
        }
      }
      return event;
    },
  });
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
};

export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

export const clearUser = () => {
  Sentry.setUser(null);
};

// Performance monitoring
export const startTransaction = (name: string, operation: string = "navigation") => {
  const startSpan = (
    Sentry as typeof Sentry & {
      startSpan?: (ctx: { name: string; op: string }) => { end: () => void };
    }
  ).startSpan;
  if (startSpan) {
    return startSpan({ name, op: operation });
  }
  return { end: () => undefined, finish: () => undefined, setTag: () => undefined };
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};
