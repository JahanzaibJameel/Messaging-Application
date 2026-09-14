/**
 * Sentry Configuration
 * Enterprise-grade error monitoring and performance tracking
 */

import * as Sentry from "@sentry/react-native";
import { reactNavigationIntegration } from "@sentry/react-native";

// Sentry DSN from environment variables
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// Environment configuration
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || "development";

// Sample rate configuration
const SAMPLE_RATE = SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0;

/**
 * Initialize Sentry with enterprise configuration
 */
export const initializeSentry = () => {
  if (!SENTRY_DSN) {
    console.warn("Sentry DSN not found. Error monitoring disabled.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: SENTRY_ENVIRONMENT === "development",
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SAMPLE_RATE,
    _experiments: {
      profilesSampleRate: SAMPLE_RATE,
    },
    beforeSend: (event, _hint) => {
      if (event.exception) {
        const exception = event.exception.values?.[0];
        if (
          exception?.value?.includes("password") ||
          exception?.value?.includes("token") ||
          exception?.value?.includes("secret")
        ) {
          return null;
        }
      }

      event.tags = {
        ...event.tags,
        platform: "react-native",
        appVersion: process.env.EXPO_PUBLIC_VERSION || "1.0.0",
      };

      return event;
    },
    beforeBreadcrumb: (breadcrumb, _hint) => {
      if (
        breadcrumb.message?.includes("password") ||
        breadcrumb.message?.includes("token") ||
        breadcrumb.message?.includes("secret")
      ) {
        return null;
      }

      if (breadcrumb.category === "websocket" && breadcrumb.message) {
        breadcrumb.message = breadcrumb.message.replace(
          /"content":"[^"]*"/g,
          '"content":"[REDACTED]"'
        );
      }

      return breadcrumb;
    },
    integrations: [reactNavigationIntegration()],
    release: `${process.env.EXPO_PUBLIC_APP_NAME || "chatapp"}@${process.env.EXPO_PUBLIC_VERSION || "1.0.0"}`,
    dist: process.env.EXPO_PUBLIC_BUILD_NUMBER || "1",
  });
};

export const configureNavigationTracing = (_navigationRef: unknown) => {
  // Navigation tracing is handled by reactNavigationIntegration
};

export const setUserContext = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email: email || undefined,
    username: username || undefined,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const addUserActionBreadcrumb = (action: string, data?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category: "user",
    message: action,
    level: "info",
    data: sanitizeData(data),
  });
};

export const addNavigationBreadcrumb = (screenName: string, params?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Navigated to ${screenName}`,
    level: "info",
    data: {
      screen: screenName,
      ...sanitizeData(params),
    },
  });
};

export const addWebSocketBreadcrumb = (event: string, data?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category: "websocket",
    message: `WebSocket ${event}`,
    level: "info",
    data: sanitizeWebSocketData(data),
  });
};

export const addStoreBreadcrumb = (action: string, data?: Record<string, unknown>) => {
  Sentry.addBreadcrumb({
    category: "store",
    message: `Store action: ${action}`,
    level: "info",
    data: sanitizeData(data),
  });
};

export const captureException = (
  error: Error,
  context?: {
    action?: string;
    screen?: string;
    userId?: string;
    additionalData?: Record<string, unknown>;
  }
) => {
  if (context) {
    Sentry.withScope((scope) => {
      if (context.action) {
        scope.setTag("action", context.action);
      }
      if (context.screen) {
        scope.setTag("screen", context.screen);
      }
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.additionalData) {
        scope.setContext("additional", sanitizeData(context.additionalData) || {});
      }

      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (data) {
      scope.setContext("data", sanitizeData(data) || {});
    }
    Sentry.captureMessage(message, level);
  });
};

const sanitizeData = (data?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!data) return undefined;

  const sensitiveKeys = ["password", "token", "secret", "key", "auth", "credential"];
  const sanitized: Record<string, unknown> = {};

  Object.keys(data).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof data[key] === "string" && data[key].length > 100) {
      sanitized[key] = data[key].substring(0, 100) + "...";
    } else if (typeof data[key] === "object" && data[key] !== null) {
      sanitized[key] = sanitizeData(data[key] as Record<string, unknown>);
    } else {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
};

const sanitizeWebSocketData = (
  data?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!data) return undefined;

  const sanitized = { ...data };

  if (sanitized.content) {
    (sanitized as Record<string, unknown>).content = "[REDACTED]";
  }

  if (sanitized.text) {
    const text = sanitized.text as string;
    (sanitized as Record<string, unknown>).text =
      text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  return sanitizeData(sanitized);
};

export default Sentry;
