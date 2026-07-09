/**
 * Sentry Error Report Hook
 * Provides utilities for manually reporting errors to Sentry
 */

import { useCallback } from "react";
import { captureException, captureMessage, addUserActionBreadcrumb } from "../monitoring/sentry";

interface ErrorReportOptions {
  context?: {
    action?: string;
    screen?: string;
    userId?: string;
    additionalData?: Record<string, any>;
  };
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  tags?: Record<string, string>;
}

export const useSentryErrorReport = () => {
  const reportError = useCallback((error: Error | string, options?: ErrorReportOptions) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    if (options?.context) {
      captureException(errorObj, options.context);
    } else {
      captureException(errorObj);
    }

    addUserActionBreadcrumb("manual_error_report", {
      errorType: errorObj.name,
      errorMessage: errorObj.message.substring(0, 100),
      context: options?.context?.action || "unknown",
    });
  }, []);

  const reportMessage = useCallback(
    (message: string, level: ErrorReportOptions["level"] = "info", data?: Record<string, any>) => {
      captureMessage(message, level, data);

      addUserActionBreadcrumb("manual_message_report", {
        message: message.substring(0, 100),
        level,
        hasData: !!data,
      });
    },
    []
  );

  const reportUserFeedback = useCallback(
    (
      feedback: string,
      context?: {
        screen?: string;
        feature?: string;
        userEmail?: string;
      }
    ) => {
      const feedbackMessage = `User Feedback: ${feedback}`;

      captureMessage(feedbackMessage, "info", {
        feedbackType: "user_feedback",
        ...context,
      });

      addUserActionBreadcrumb("user_feedback", {
        feedbackLength: feedback.length,
        screen: context?.screen,
        feature: context?.feature,
      });
    },
    []
  );

  const reportPerformanceIssue = useCallback(
    (
      issue: string,
      metrics?: {
        duration?: number;
        memoryUsage?: number;
        operation?: string;
      }
    ) => {
      const performanceMessage = `Performance Issue: ${issue}`;

      captureMessage(performanceMessage, "warning", {
        issueType: "performance",
        ...metrics,
      });

      addUserActionBreadcrumb("performance_issue", {
        issue,
        duration: metrics?.duration,
        operation: metrics?.operation,
      });
    },
    []
  );

  const reportNetworkError = useCallback(
    (
      error: Error | string,
      context?: {
        url?: string;
        method?: string;
        statusCode?: number;
        responseTime?: number;
      }
    ) => {
      const errorObj = typeof error === "string" ? new Error(error) : error;

      captureException(errorObj, {
        action: "network_request",
        screen: context?.url || "unknown",
        additionalData: {
          method: context?.method,
          statusCode: context?.statusCode,
          responseTime: context?.responseTime,
          url: context?.url,
        },
      });

      addUserActionBreadcrumb("network_error", {
        url: context?.url,
        method: context?.method,
        statusCode: context?.statusCode,
      });
    },
    []
  );

  const reportUIIssue = useCallback(
    (
      issue: string,
      context?: {
        component?: string;
        action?: string;
        userAction?: string;
      }
    ) => {
      const uiMessage = `UI Issue: ${issue}`;

      captureMessage(uiMessage, "warning", {
        issueType: "ui_ux",
        ...context,
      });

      addUserActionBreadcrumb("ui_issue", {
        issue,
        component: context?.component,
        action: context?.action,
        userAction: context?.userAction,
      });
    },
    []
  );

  return {
    reportError,
    reportMessage,
    reportUserFeedback,
    reportPerformanceIssue,
    reportNetworkError,
    reportUIIssue,
  };
};

export default useSentryErrorReport;
