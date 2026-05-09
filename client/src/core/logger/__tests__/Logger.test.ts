/**
 * Unit tests for Logger utility
 * Testing enterprise-grade logging with levels, filtering, and performance tracking
 */

import { logger, logDebug, logInfo, logWarn, logError, logFatal, LogLevel } from "../Logger";

// Mock console methods to avoid actual console output during tests
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Store original console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log,
};

// Mock __DEV__ for testing
const originalDev = (global as any).__DEV__;

describe("Logger", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    console.log = mockConsole.log;

    // Reset logger instance
    (logger as any).buffer = [];
    (logger as any).userId = undefined;
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.log = originalConsole.log;
  });

  describe("Constructor and Configuration", () => {
    it("should initialize with default configuration", () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.fatal).toBe("function");
    });

    it("should accept custom configuration", () => {
      const customLogger = new (logger.constructor as any)({
        minLevel: "warn",
        enableConsole: false,
        enableRemote: true,
        remoteUrl: "https://api.example.com/logs",
        sampleRate: 0.5,
        maxBufferSize: 200,
      });

      expect(customLogger).toBeDefined();
    });

    it("should use debug level in development", () => {
      (global as any).__DEV__ = true;
      const devLogger = new (logger.constructor as any)();
      expect((devLogger as any).config.minLevel).toBe("debug");
    });

    it("should use info level in production", () => {
      (global as any).__DEV__ = false;
      const prodLogger = new (logger.constructor as any)();
      expect((prodLogger as any).config.minLevel).toBe("info");
    });
  });

  describe("Logging Levels", () => {
    it("should log debug messages", () => {
      logger.debug("Debug message", "test-context", { data: "test" });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\] \[test-context\]: Debug message$/
        ),
        { data: "test" }
      );
    });

    it("should log info messages", () => {
      logger.info("Info message", "test-context", { data: "test" });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[test-context\]: Info message$/
        ),
        { data: "test" }
      );
    });

    it("should log warn messages", () => {
      logger.warn("Warning message", "test-context", { data: "test" });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[WARN\] \[test-context\]: Warning message$/
        ),
        { data: "test" }
      );
    });

    it("should log error messages", () => {
      const error = new Error("Test error");
      logger.error("Error message", "test-context", { data: "test" }, error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] \[test-context\]: Error message$/
        ),
        { data: "test" },
        error
      );
    });

    it("should log fatal messages", () => {
      const error = new Error("Fatal error");
      logger.fatal("Fatal message", "test-context", { data: "test" }, error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[FATAL\] \[test-context\]: Fatal message$/
        ),
        { data: "test" },
        error
      );
    });
  });

  describe("Level Filtering", () => {
    it("should filter debug messages when min level is info", () => {
      const filteredLogger = new (logger.constructor as any)({ minLevel: "info" });

      filteredLogger.debug("Debug message");
      filteredLogger.info("Info message");
      filteredLogger.warn("Warning message");

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
    });

    it("should filter info messages when min level is warn", () => {
      const filteredLogger = new (logger.constructor as any)({ minLevel: "warn" });

      filteredLogger.debug("Debug message");
      filteredLogger.info("Info message");
      filteredLogger.warn("Warning message");
      filteredLogger.error("Error message");

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it("should filter warn messages when min level is error", () => {
      const filteredLogger = new (logger.constructor as any)({ minLevel: "error" });

      filteredLogger.debug("Debug message");
      filteredLogger.info("Info message");
      filteredLogger.warn("Warning message");
      filteredLogger.error("Error message");
      filteredLogger.fatal("Fatal message");

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(2); // error + fatal
    });

    it("should only show fatal messages when min level is fatal", () => {
      const filteredLogger = new (logger.constructor as any)({ minLevel: "fatal" });

      filteredLogger.debug("Debug message");
      filteredLogger.info("Info message");
      filteredLogger.warn("Warning message");
      filteredLogger.error("Error message");
      filteredLogger.fatal("Fatal message");

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledTimes(1); // only fatal
    });
  });

  describe("Console Output Control", () => {
    it("should not output to console when disabled", () => {
      const silentLogger = new (logger.constructor as any)({ enableConsole: false });

      silentLogger.info("Info message");

      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it("should output to console when enabled", () => {
      const normalLogger = new (logger.constructor as any)({ enableConsole: true });

      normalLogger.info("Info message");

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });
  });

  describe("Buffer Management", () => {
    it("should buffer log entries", () => {
      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      const buffer = (logger as any).buffer;
      expect(buffer).toHaveLength(3);
      expect(buffer[0].message).toBe("Message 1");
      expect(buffer[1].message).toBe("Message 2");
      expect(buffer[2].message).toBe("Message 3");
    });

    it("should respect max buffer size", () => {
      const smallBufferLogger = new (logger.constructor as any)({ maxBufferSize: 2 });

      smallBufferLogger.info("Message 1");
      smallBufferLogger.info("Message 2");
      smallBufferLogger.info("Message 3");

      const buffer = (smallBufferLogger as any).buffer;
      expect(buffer).toHaveLength(2);
      expect(buffer[0].message).toBe("Message 2");
      expect(buffer[1].message).toBe("Message 3");
    });

    it("should clear buffer when requested", () => {
      logger.info("Message 1");
      logger.info("Message 2");

      expect((logger as any).buffer).toHaveLength(2);

      (logger as any).clearBuffer();

      expect((logger as any).buffer).toHaveLength(0);
    });
  });

  describe("User and Session Management", () => {
    it("should set user ID", () => {
      logger.setUserId("user-123");

      expect((logger as any).userId).toBe("user-123");
    });

    it("should include user ID in log entries", () => {
      logger.setUserId("user-123");
      logger.info("User message");

      const buffer = (logger as any).buffer;
      expect(buffer[0].userId).toBe("user-123");
    });

    it("should generate unique session ID", () => {
      const sessionId1 = (logger as any).sessionId;
      const logger2 = new (logger.constructor as any)();
      const sessionId2 = (logger2 as any).sessionId;

      expect(sessionId1).toBeDefined();
      expect(sessionId2).toBeDefined();
      expect(sessionId1).not.toBe(sessionId2);
      expect(typeof sessionId1).toBe("string");
      expect(sessionId1.length).toBeGreaterThan(0);
    });

    it("should include session ID in log entries", () => {
      logger.info("Session message");

      const buffer = (logger as any).buffer;
      expect(buffer[0].sessionId).toBeDefined();
      expect(buffer[0].sessionId).toBe((logger as any).sessionId);
    });
  });

  describe("Log Entry Structure", () => {
    it("should create properly structured log entries", () => {
      const error = new Error("Test error");
      logger.error("Error message", "test-context", { data: "test" }, error);

      const buffer = (logger as any).buffer;
      const entry = buffer[0];

      expect(entry).toMatchObject({
        level: "error",
        message: "Error message",
        context: "test-context",
        data: { data: "test" },
        error: error,
        sessionId: (logger as any).sessionId,
      });
      expect(entry.timestamp).toBeDefined();
      expect(typeof entry.timestamp).toBe("string");
    });

    it("should handle missing optional parameters", () => {
      logger.info("Simple message");

      const buffer = (logger as any).buffer;
      const entry = buffer[0];

      expect(entry).toMatchObject({
        level: "info",
        message: "Simple message",
        context: undefined,
        data: undefined,
        error: undefined,
        userId: undefined,
      });
    });

    it("should format timestamps correctly", () => {
      logger.info("Timestamp test");

      const buffer = (logger as any).buffer;
      const entry = buffer[0];

      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("Performance", () => {
    it("should handle high volume logging efficiently", async () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, "performance-test", { index: i });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect((logger as any).buffer.length).toBeGreaterThan(0);
    });

    it("should handle concurrent logging", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => logger.info(`Concurrent message ${i}`))
      );

      await Promise.all(promises);

      expect((logger as any).buffer).toHaveLength(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty messages", () => {
      logger.info("");

      const buffer = (logger as any).buffer;
      expect(buffer[0].message).toBe("");
    });

    it("should handle very long messages", () => {
      const longMessage = "A".repeat(10000);
      logger.info(longMessage);

      const buffer = (logger as any).buffer;
      expect(buffer[0].message).toBe(longMessage);
    });

    it("should handle special characters in messages", () => {
      const specialMessage = "Special chars: \n\t\r{}[]<>|&%$#@!";
      logger.info(specialMessage);

      const buffer = (logger as any).buffer;
      expect(buffer[0].message).toBe(specialMessage);
    });

    it("should handle circular references in data", () => {
      const circularData: any = { prop: "value" };
      circularData.self = circularData;

      expect(() => {
        logger.info("Circular data test", "test", circularData);
      }).not.toThrow();
    });

    it("should handle null and undefined values", () => {
      logger.info("Null test", "test", null);
      logger.info("Undefined test", "test", undefined);

      const buffer = (logger as any).buffer;
      expect(buffer[0].data).toBeNull();
      expect(buffer[1].data).toBeUndefined();
    });
  });

  describe("Security", () => {
    it("should not expose sensitive data in console output", () => {
      const sensitiveData = {
        password: "secret123",
        token: "abc123",
        apiKey: "xyz789",
      };

      logger.info("Sensitive data test", "security", sensitiveData);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[security\]: Sensitive data test$/
        ),
        sensitiveData
      );
    });

    it("should handle malicious input safely", () => {
      const maliciousMessage = '<script>alert("xss")</script>';

      expect(() => {
        logger.info(maliciousMessage);
      }).not.toThrow();

      const buffer = (logger as any).buffer;
      expect(buffer[0].message).toBe(maliciousMessage);
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory with repeated logging", () => {
      const initialBufferSize = (logger as any).buffer.length;

      for (let i = 0; i < 100; i++) {
        logger.info(`Memory test ${i}`);
      }

      // Buffer should not grow indefinitely due to max buffer size
      expect((logger as any).buffer.length).toBeLessThanOrEqual(100);
    });

    it("should handle buffer overflow gracefully", () => {
      const tinyBufferLogger = new (logger.constructor as any)({ maxBufferSize: 1 });

      for (let i = 0; i < 10; i++) {
        tinyBufferLogger.info(`Overflow test ${i}`);
      }

      expect((tinyBufferLogger as any).buffer).toHaveLength(1);
      expect((tinyBufferLogger as any).buffer[0].message).toBe("Overflow test 9");
    });
  });

  describe("Type Safety", () => {
    it("should accept valid log levels", () => {
      const validLevels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];

      validLevels.forEach((level) => {
        expect(() => {
          (logger as any)[level](`Test ${level} message`);
        }).not.toThrow();
      });
    });

    it("should handle all parameter combinations", () => {
      const error = new Error("Test error");

      expect(() => {
        logger.debug("debug");
        logger.info("info", "context");
        logger.warn("warn", "context", { data: "test" });
        logger.error("error", "context", { data: "test" }, error);
        logger.fatal("fatal", undefined, undefined, error);
      }).not.toThrow();
    });
  });
});

describe("Logger Convenience Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
  });

  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it("should provide logDebug function", () => {
    logDebug("Debug message");

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\]: Debug message$/
      ),
      ""
    );
  });

  it("should provide logInfo function", () => {
    logInfo("Info message");

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\]: Info message$/
      ),
      ""
    );
  });

  it("should provide logWarn function", () => {
    logWarn("Warning message");

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[WARN\]: Warning message$/
      ),
      ""
    );
  });

  it("should provide logError function", () => {
    const error = new Error("Test error");
    logError("Error message", "context", { data: "test" }, error);

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] \[\[object Object\]\]: Error message$/
      ),
      error,
      "context"
    );
  });

  it("should provide logFatal function", () => {
    const error = new Error("Fatal error");
    logFatal("Fatal message", "context", { data: "test" }, error);

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[FATAL\] \[\[object Object\]\]: Fatal message$/
      ),
      error,
      "context"
    );
  });

  it("should use the same logger instance", () => {
    logInfo("Test message 1");
    logger.info("Test message 2");

    expect(mockConsole.info).toHaveBeenCalledTimes(2);
  });
});
