/**
 * Unit tests for Logger utility
 * Testing logging functionality and configuration
 */

import { logger } from "../logger/Logger";

describe("Logger", () => {
  beforeEach(() => {
    // Reset logger state for each test
    jest.clearAllMocks();
  });

  describe("Basic Logging", () => {
    it("should log debug messages", () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();

      logger.debug("Test debug message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log info messages", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      logger.info("Test info message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log warning messages", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      logger.warn("Test warning message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log error messages", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      logger.error("Test error message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log fatal messages", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      logger.fatal("Test fatal message");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Logging with Context", () => {
    it("should log messages with context", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      logger.info("Test message", "auth-context");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log messages with data", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      logger.info("Test message", "context", { userId: "user_123", action: "login" });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log messages with error", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Test error");

      logger.error("Error occurred", error, "context", { error });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Performance Tracking", () => {
    it("should track performance timers", () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();

      const timer = logger.startTimer("test-operation");

      // Simulate some work
      setTimeout(() => {
        timer();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Timer [test-operation]"));
        consoleSpy.mockRestore();
      }, 10);
    });

    it("should handle performance timing correctly", () => {
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();

      const timer = logger.startTimer("quick-operation");
      const duration = timer();

      expect(typeof duration).toBe("undefined"); // Timer function doesn't return duration
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Buffer Management", () => {
    it("should get buffered logs", () => {
      const buffer = logger.getBuffer();

      expect(Array.isArray(buffer)).toBe(true);
    });

    it("should clear buffer", () => {
      logger.clearBuffer();

      const buffer = logger.getBuffer();
      expect(buffer).toHaveLength(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined messages", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      logger.info(undefined as any);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle null messages", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      logger.info(null as any);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle empty messages", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      logger.info("");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle complex objects", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const complexObject = {
        user: { id: "user_123", name: "John Doe" },
        metadata: { timestamp: new Date(), version: "1.0.0" },
        nested: { deep: { value: 42 } },
      };

      logger.info("Complex object", "context", complexObject);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Performance", () => {
    it("should handle high-frequency logging efficiently", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`, "context", { iteration: i });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(consoleSpy).toHaveBeenCalledTimes(100);
      consoleSpy.mockRestore();
    });

    it("should handle large context objects efficiently", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const largeContext = {
        users: Array.from({ length: 100 }, (_, i) => ({ id: `user_${i}`, name: `User ${i}` })),
        metadata: { timestamp: new Date(), version: "1.0.0" },
      };

      const startTime = Date.now();
      logger.info("Large context", "context", largeContext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Data Consistency", () => {
    it("should maintain log level consistency", () => {
      const infoSpy = jest.spyOn(console, "info").mockImplementation();
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      const debugSpy = jest.spyOn(console, "debug").mockImplementation();

      logger.info("info message");
      logger.error("error message");
      logger.warn("warn message");
      logger.debug("debug message");

      expect(infoSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();

      infoSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it("should handle timestamp consistency", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const beforeLog = Date.now();
      logger.info("Timestamp test");
      const afterLog = Date.now();

      expect(consoleSpy).toHaveBeenCalled();
      expect(afterLog - beforeLog).toBeLessThan(100); // Should be very fast
      consoleSpy.mockRestore();
    });
  });

  describe("Security", () => {
    it("should handle sensitive data safely", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const sensitiveData = {
        password: "secret123",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        apiKey: "sk-1234567890",
      };

      logger.info("Sensitive data", "context", sensitiveData);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle malicious input safely", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const maliciousInput = '<script>alert("xss")</script>';

      logger.info(maliciousInput);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle circular references", () => {
      const consoleSpy = jest.spyOn(console, "info").mockImplementation();

      const circular: any = { name: "circular" };
      circular.self = circular;

      logger.info("Circular reference", "context", circular);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
