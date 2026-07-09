/**
 * Sentry Mock for Testing
 * Provides mock implementations for Sentry functions in test environment
 */

import { jest, expect } from "@jest/globals";

export const mockSentry = {
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn(),
  ReactNativeTracing: jest.fn(),
  SeverityLevel: {
    Fatal: "fatal",
    Error: "error",
    Warning: "warning",
    Info: "info",
    Debug: "debug",
  },
};

export const mockReactNavigationIntegration = jest.fn();

export const initializeSentry = jest.fn();
export const configureNavigationTracing = jest.fn();
export const setUserContext = jest.fn();
export const clearUserContext = jest.fn();
export const addUserActionBreadcrumb = jest.fn();
export const addNavigationBreadcrumb = jest.fn();
export const addWebSocketBreadcrumb = jest.fn();
export const addStoreBreadcrumb = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();

export const resetSentryMocks = () => {
  Object.values(mockSentry).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  initializeSentry.mockReset();
  configureNavigationTracing.mockReset();
  setUserContext.mockReset();
  clearUserContext.mockReset();
  addUserActionBreadcrumb.mockReset();
  addNavigationBreadcrumb.mockReset();
  addWebSocketBreadcrumb.mockReset();
  addStoreBreadcrumb.mockReset();
  captureException.mockReset();
  captureMessage.mockReset();
  mockReactNavigationIntegration.mockReset();
};

export const expectBreadcrumbCall = (category: string, message: string) => {
  expect(addUserActionBreadcrumb).toHaveBeenCalledWith(
    expect.objectContaining({
      category,
      message: expect.stringContaining(message),
    })
  );
};

export const expectExceptionCapture = (error: Error, context?: any) => {
  if (context) {
    expect(captureException).toHaveBeenCalledWith(error, context);
  } else {
    expect(captureException).toHaveBeenCalledWith(error);
  }
};

export const expectMessageCapture = (message: string, level: string, data?: any) => {
  if (data) {
    expect(captureMessage).toHaveBeenCalledWith(message, level, data);
  } else {
    expect(captureMessage).toHaveBeenCalledWith(message, level);
  }
};

export default mockSentry;
