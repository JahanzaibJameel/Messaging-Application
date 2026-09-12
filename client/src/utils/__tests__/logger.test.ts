import {
  LogLevel,
  logger,
  debug,
  info,
  warn,
  error,
  fatal,
  breadcrumb,
  time,
  timeEnd,
  networkRequest,
  userInteraction,
  security,
} from "../logger";
import * as sentry from "../../monitoring/sentry";

const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
};

describe("Logger Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);

    console.log = mockConsole.log;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    console.debug = mockConsole.debug;
    console.time = mockConsole.time;
    console.timeEnd = mockConsole.timeEnd;
  });

  it("defines all log levels", () => {
    expect(LogLevel.DEBUG).toBe("debug");
    expect(LogLevel.INFO).toBe("info");
    expect(LogLevel.WARN).toBe("warn");
    expect(LogLevel.ERROR).toBe("error");
    expect(LogLevel.FATAL).toBe("fatal");
  });

  it("sets the minimum log level", () => {
    logger.setLogLevel(LogLevel.ERROR);
    logger.debug("debug");
    logger.info("info");
    logger.warn("warn");
    logger.error("error");
    logger.fatal("fatal");

    expect(logger.getRecentLogs().map((entry) => entry.level)).toEqual([
      LogLevel.ERROR,
      LogLevel.FATAL,
    ]);
    expect(mockConsole.error).toHaveBeenCalledTimes(2);
  });

  it("logs debug messages and adds an entry", () => {
    logger.debug("Debug message", { data: "test" }, "debug-category");

    expect(mockConsole.log).toHaveBeenCalled();
    const entry = logger.getRecentLogs()[0];
    expect(entry).toMatchObject({
      level: LogLevel.DEBUG,
      message: "Debug message",
      data: { data: "test" },
      category: "debug-category",
    });
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it("logs info messages and adds an entry", () => {
    logger.info("Info message", { data: "test" }, "info-category");

    expect(mockConsole.info).toHaveBeenCalled();
    const entry = logger.getRecentLogs()[0];
    expect(entry).toMatchObject({
      level: LogLevel.INFO,
      message: "Info message",
      data: { data: "test" },
      category: "info-category",
    });
  });

  it("logs warning messages and adds an entry", () => {
    logger.warn("Warning message", { data: "test" }, "warning-category");

    expect(mockConsole.warn).toHaveBeenCalled();
    const entry = logger.getRecentLogs()[0];
    expect(entry).toMatchObject({
      level: LogLevel.WARN,
      message: "Warning message",
      category: "warning-category",
    });
  });

  it("sends Error instances to Sentry when logging errors", () => {
    const sentryError = jest.spyOn(sentry, "captureException").mockImplementation(jest.fn());
    const errorObject = new Error("Test error");

    logger.error("Error message", errorObject, "error-category");

    expect(mockConsole.error).toHaveBeenCalled();
    expect(sentryError).toHaveBeenCalledWith(errorObject, {
      action: "logger_error",
      screen: "error-category",
      additionalData: { message: "Error message" },
    });
    expect(logger.getRecentLogs()[0]).toMatchObject({
      level: LogLevel.ERROR,
      data: errorObject,
    });
  });

  it("uses captureMessage for non-Error values when logging errors", () => {
    const captureMessage = jest.spyOn(sentry, "captureMessage").mockImplementation(jest.fn());

    logger.error("Error message", { custom: "error" }, "error-category");

    expect(captureMessage).toHaveBeenCalledWith("Error message", "error", { custom: "error" });
  });

  it("sends Error instances to Sentry when logging fatal errors", () => {
    const sentryError = jest.spyOn(sentry, "captureException").mockImplementation(jest.fn());
    const errorObject = new Error("Fatal error");

    logger.fatal("Fatal message", errorObject, "fatal-category");

    expect(mockConsole.error).toHaveBeenCalled();
    expect(sentryError).toHaveBeenCalledWith(errorObject, {
      action: "logger_fatal",
      screen: "fatal-category",
      additionalData: { message: "Fatal message", isFatal: true },
    });
  });

  it("uses captureMessage for non-Error values when logging fatal errors", () => {
    const captureMessage = jest.spyOn(sentry, "captureMessage").mockImplementation(jest.fn());

    logger.fatal("Fatal message", { custom: "fatal" });

    expect(captureMessage).toHaveBeenCalledWith("Fatal message", "fatal", { custom: "fatal" });
  });

  it("formats console messages with timestamp, level, category, and data", () => {
    logger.info("Test message", { key: "value" }, "test-category");

    expect(mockConsole.info).toHaveBeenCalled();
    expect(mockConsole.info.mock.calls[0][0]).toContain("Test message");
    expect(mockConsole.info.mock.calls[0][0]).toContain("[test-category]");
    expect(mockConsole.info.mock.calls[0][0]).toContain("key");
    expect(mockConsole.info.mock.calls[0][0]).toContain("value");
  });

  it("formats string data directly", () => {
    logger.info("Test", "string data");

    expect(mockConsole.info).toHaveBeenCalled();
    expect(mockConsole.info.mock.calls[0][0]).toContain("Test");
    expect(mockConsole.info.mock.calls[0][0]).toContain("string data");
  });

  it("handles data that cannot be serialized", () => {
    const circular: any = { prop: "value" };
    circular.self = circular;

    logger.info("Test", circular, "category");

    expect(mockConsole.info).toHaveBeenCalled();
    expect(mockConsole.info.mock.calls[0][0]).toContain("[Data could not be serialized");
  });

  it("does not include a category when none is provided", () => {
    logger.info("Simple message");

    expect(mockConsole.info).toHaveBeenCalled();
    expect(mockConsole.info.mock.calls[0][0]).toContain("Simple message");
    expect(mockConsole.info.mock.calls[0][0]).not.toContain("[]");
  });

  it("returns recent logs and limits the result count", () => {
    for (let index = 0; index < 10; index += 1) {
      logger.info(`Message ${index}`);
    }

    expect(logger.getRecentLogs()).toHaveLength(10);
    expect(logger.getRecentLogs(5)).toHaveLength(5);
    expect(logger.getRecentLogs(5)[0].message).toBe("Message 5");
    expect(logger.getRecentLogs(5)[4].message).toBe("Message 9");
  });

  it("trims the log buffer to the configured maximum", () => {
    logger.setLogLevel(LogLevel.INFO);
    for (let index = 0; index < 10; index += 1) {
      logger.info(`Message ${index}`);
    }

    expect(logger.getRecentLogs(100)).toHaveLength(10);
  });

  it("filters logs by level", () => {
    logger.info("Info message");
    logger.warn("Warning message");
    logger.info("Another info");

    const infoLogs = logger.getLogsByLevel(LogLevel.INFO);
    expect(infoLogs).toHaveLength(2);
    expect(infoLogs.map((entry) => entry.message)).toEqual(["Info message", "Another info"]);
    expect(logger.getLogsByLevel(LogLevel.ERROR)).toHaveLength(0);
  });

  it("filters logs by category", () => {
    logger.info("Message 1", undefined, "auth");
    logger.info("Message 2", undefined, "network");
    logger.info("Message 3", undefined, "auth");

    const authLogs = logger.getLogsByCategory("auth");
    expect(authLogs).toHaveLength(2);
    expect(authLogs.map((entry) => entry.message)).toEqual(["Message 1", "Message 3"]);
    expect(logger.getLogsByCategory("network")).toHaveLength(1);
    expect(logger.getLogsByCategory("missing")).toHaveLength(0);
  });

  it("clears all log entries", () => {
    logger.info("Message 1");
    logger.info("Message 2");
    logger.clearLogs();

    expect(logger.getRecentLogs()).toHaveLength(0);
  });

  it("exports logs as JSON", () => {
    logger.info("Test message", { key: "value" });

    const parsed = JSON.parse(logger.exportLogs());
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ message: "Test message", data: { key: "value" } });
    expect(logger.exportLogs()).toContain("Test message");
  });

  it("adds breadcrumbs with default and custom categories", () => {
    const addBreadcrumb = jest
      .spyOn(sentry, "addUserActionBreadcrumb")
      .mockImplementation(jest.fn());

    logger.breadcrumb("test_action", { data: "value" });
    logger.breadcrumb("test_action", { data: "value" }, "custom-category");
    logger.breadcrumb("test_action");

    expect(addBreadcrumb).toHaveBeenNthCalledWith(1, "test_action", {
      category: "user_action",
      data: "value",
    });
    expect(addBreadcrumb).toHaveBeenNthCalledWith(2, "test_action", {
      category: "custom-category",
      data: "value",
    });
    expect(addBreadcrumb).toHaveBeenNthCalledWith(3, "test_action", {
      category: "user_action",
    });
  });

  it("tracks performance timers and breadcrumbs", () => {
    const addBreadcrumb = jest
      .spyOn(sentry, "addUserActionBreadcrumb")
      .mockImplementation(jest.fn());

    logger.time("test-timer");
    logger.timeEnd("test-timer");

    expect(mockConsole.time).toHaveBeenCalledWith("test-timer");
    expect(mockConsole.timeEnd).toHaveBeenCalledWith("test-timer");
    expect(addBreadcrumb).toHaveBeenCalledWith("timer_start", {
      label: "test-timer",
      category: "performance",
    });
    expect(addBreadcrumb).toHaveBeenCalledWith("timer_end", {
      label: "test-timer",
      category: "performance",
    });
  });

  it("logs network requests based on status code", () => {
    logger.networkRequest("https://api.example.com", "GET", 500, 100);
    expect(logger.getRecentLogs()[0]).toMatchObject({
      level: LogLevel.ERROR,
      category: "network",
      data: {
        url: "https://api.example.com",
        method: "GET",
        statusCode: 500,
        duration: 100,
      },
    });

    logger.clearLogs();
    logger.networkRequest("https://api.example.com", "GET", 200, 50);
    expect(logger.getRecentLogs()[0]).toMatchObject({ level: LogLevel.INFO, category: "network" });

    logger.clearLogs();
    logger.networkRequest("https://api.example.com", "POST");
    expect(logger.getRecentLogs()[0].level).toBe(LogLevel.INFO);
  });

  it("logs user interactions and breadcrumbs", () => {
    const addBreadcrumb = jest
      .spyOn(sentry, "addUserActionBreadcrumb")
      .mockImplementation(jest.fn());

    logger.userInteraction("button_click", "submit-button", { count: 1 });

    expect(mockConsole.info).toHaveBeenCalled();
    expect(logger.getRecentLogs()[0]).toMatchObject({
      message: "User button_click",
      category: "user_interaction",
      data: { action: "button_click", element: "submit-button", count: 1 },
    });
    expect(addBreadcrumb).toHaveBeenCalledWith("User button_click", {
      action: "button_click",
      element: "submit-button",
      count: 1,
      category: "user_action",
    });
  });

  it("logs security events and sends them to Sentry", () => {
    const captureMessage = jest.spyOn(sentry, "captureMessage").mockImplementation(jest.fn());

    logger.security("unauthorized_access", { userId: "123" });

    expect(mockConsole.warn).toHaveBeenCalled();
    expect(logger.getRecentLogs()[0]).toMatchObject({
      message: "Security: unauthorized_access",
      category: "security",
      level: LogLevel.WARN,
    });
    expect(captureMessage).toHaveBeenCalledWith("Security: unauthorized_access", "warning", {
      securityEvent: true,
      userId: "123",
    });
  });

  it("exports convenience logging functions", () => {
    const addBreadcrumb = jest
      .spyOn(sentry, "addUserActionBreadcrumb")
      .mockImplementation(jest.fn());
    const captureMessage = jest.spyOn(sentry, "captureMessage").mockImplementation(jest.fn());

    debug("Debug message", { data: "test" }, "category");
    info("Info message");
    warn("Warning message");
    error("Error message", new Error("Test"), "category");
    fatal("Fatal message", new Error("Fatal"), "category");
    breadcrumb("user_action", { data: "test" }, "category");
    time("timer-label");
    timeEnd("timer-label");
    networkRequest("https://example.com", "GET", 200, 50);
    userInteraction("click", "button", { id: "1" });
    security("test_event", { data: "test" });

    expect(mockConsole.log).toHaveBeenCalled();
    expect(mockConsole.info).toHaveBeenCalled();
    expect(mockConsole.warn).toHaveBeenCalled();
    expect(mockConsole.error).toHaveBeenCalled();
    expect(addBreadcrumb).toHaveBeenCalled();
    expect(captureMessage).toHaveBeenCalled();
  });

  it("handles null and undefined error values", () => {
    logger.error("Error message", null, "context");
    logger.error("Error message", undefined, "context");
    logger.fatal("Fatal message", null);
    logger.fatal("Fatal message", undefined);

    expect(mockConsole.error).toHaveBeenCalledTimes(4);
    expect(logger.getRecentLogs()).toHaveLength(4);
  });

  it("handles Error subclasses", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const sentryError = jest.spyOn(sentry, "captureException").mockImplementation(jest.fn());
    logger.error("Error message", new CustomError("Custom error"), "context");

    expect(sentryError).toHaveBeenCalled();
  });

  it("preserves non-serializable values in log entries", () => {
    const fn = () => {};
    logger.info("Test message", { fn }, "category");

    expect(logger.getRecentLogs()[0].data.fn).toBe(fn);
  });

  it("creates log entries with timestamps", () => {
    logger.info("Test message");

    expect(logger.getRecentLogs()[0].timestamp).toBeInstanceOf(Date);
  });
});
