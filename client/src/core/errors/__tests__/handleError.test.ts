/**
 * Unit tests for handleError utility
 * Testing error handling utility function
 */

import { AppError, handleError } from "../AppError";

describe("handleError", () => {
  describe("AppError Input", () => {
    it("should return AppError when given AppError", () => {
      const originalError = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });

      const result = handleError(originalError);

      expect(result).toBe(originalError);
      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.message).toBe("Network failed");
    });

    it("should return same AppError instance", () => {
      const originalError = new AppError({
        code: "AUTH_ERROR",
        message: "Auth failed",
      });

      const result = handleError(originalError);

      expect(result).toBe(originalError); // Same reference
    });
  });

  describe("Error Input", () => {
    it("should convert Error to AppError with UNKNOWN_ERROR code", () => {
      const originalError = new Error("Something went wrong");

      const result = handleError(originalError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Something went wrong");
      expect(result.originalError).toBe(originalError);
    });

    it("should preserve original error message", () => {
      const originalError = new Error("Database connection failed");

      const result = handleError(originalError);

      expect(result.message).toBe("Database connection failed");
      expect(result.originalError).toBe(originalError);
      expect(result.originalError?.message).toBe("Database connection failed");
    });

    it("should preserve original error stack", () => {
      const originalError = new Error("Stack trace test");

      const result = handleError(originalError);

      expect(result.originalError).toBe(originalError);
      expect(result.originalError?.stack).toBe(originalError.stack);
    });

    it("should handle Error with no message", () => {
      const originalError = new Error();

      const result = handleError(originalError);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("");
      expect(result.originalError).toBe(originalError);
    });

    it("should handle Error with empty message", () => {
      const originalError = new Error("");

      const result = handleError(originalError);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("");
      expect(result.originalError).toBe(originalError);
    });

    it("should handle TypeError", () => {
      const originalError = new TypeError("Cannot read property of undefined");

      const result = handleError(originalError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Cannot read property of undefined");
      expect(result.originalError).toBe(originalError);
    });

    it("should handle ReferenceError", () => {
      const originalError = new ReferenceError("Variable is not defined");

      const result = handleError(originalError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Variable is not defined");
      expect(result.originalError).toBe(originalError);
    });

    it("should handle SyntaxError", () => {
      const originalError = new SyntaxError("Unexpected token");

      const result = handleError(originalError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Unexpected token");
      expect(result.originalError).toBe(originalError);
    });
  });

  describe("String Input", () => {
    it("should convert string to AppError with UNKNOWN_ERROR code", () => {
      const errorMessage = "Something went wrong";

      const result = handleError(errorMessage);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Something went wrong");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle empty string", () => {
      const errorMessage = "";

      const result = handleError(errorMessage);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle whitespace string", () => {
      const errorMessage = "   ";

      const result = handleError(errorMessage);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("   ");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle very long string", () => {
      const errorMessage = "A".repeat(10000);

      const result = handleError(errorMessage);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe(errorMessage);
      expect(result.originalError).toBeUndefined();
    });
  });

  describe("Object Input", () => {
    it("should convert object to AppError with UNKNOWN_ERROR code", () => {
      const errorObject = { type: "custom", message: "Custom error" };

      const result = handleError(errorObject);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("[object Object]");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle null", () => {
      const result = handleError(null);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("null");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle undefined", () => {
      const result = handleError(undefined);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("undefined");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle empty object", () => {
      const errorObject = {};

      const result = handleError(errorObject);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("[object Object]");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle object with toString method", () => {
      const errorObject = {
        toString: () => "Custom error message",
      };

      const result = handleError(errorObject);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Custom error message");
      expect(result.originalError).toBeUndefined();
    });
  });

  describe("Number Input", () => {
    it("should convert number to AppError with UNKNOWN_ERROR code", () => {
      const errorCode = 404;

      const result = handleError(errorCode);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("404");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle zero", () => {
      const result = handleError(0);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("0");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle negative number", () => {
      const result = handleError(-1);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("-1");
      expect(result.originalError).toBeUndefined();
    });
  });

  describe("Boolean Input", () => {
    it("should convert boolean to AppError with UNKNOWN_ERROR code", () => {
      const result = handleError(true);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("true");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle false", () => {
      const result = handleError(false);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("false");
      expect(result.originalError).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle circular reference objects", () => {
      const circularObject: any = { prop: "value" };
      circularObject.self = circularObject;

      const result = handleError(circularObject);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("[object Object]");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle function input", () => {
      const errorFunction = () => "Error message";

      const result = handleError(errorFunction);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toContain("function errorFunction");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle array input", () => {
      const errorArray = ["error1", "error2"];

      const result = handleError(errorArray);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("error1,error2");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle Date input", () => {
      const errorDate = new Date();

      const result = handleError(errorDate);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toContain("GMT");
      expect(result.originalError).toBeUndefined();
    });

    it("should handle RegExp input", () => {
      const errorRegex = /error/g;

      const result = handleError(errorRegex);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("/error/g");
      expect(result.originalError).toBeUndefined();
    });
  });

  describe("Performance", () => {
    it("should handle errors efficiently", () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        handleError(new Error(`Error ${i}`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle different error types efficiently", () => {
      const errors = [
        new Error("Standard error"),
        "String error",
        null,
        undefined,
        { type: "object error" },
        404,
        false,
      ];

      const startTime = Date.now();

      const results = errors.map(handleError);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(7);
      expect(results.every((result) => result instanceof AppError)).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe("Consistency", () => {
    it("should return consistent AppError instances", () => {
      const error1 = handleError("Test error");
      const error2 = handleError("Test error");

      expect(error1.code).toBe(error2.code);
      expect(error1.message).toBe(error2.message);
      expect(error1).not.toBe(error2); // Different instances
    });

    it("should preserve timestamp consistency", () => {
      const beforeHandling = new Date();
      const result = handleError("Test error");
      const afterHandling = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeHandling.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterHandling.getTime());
    });

    it("should maintain error chain consistency", () => {
      const originalError = new Error("Original error");
      const result = handleError(originalError);

      expect(result.originalError).toBe(originalError);
      expect(result.originalError?.message).toBe("Original error");
    });
  });

  describe("Security", () => {
    it("should handle malicious string input safely", () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = handleError(maliciousInput);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe(maliciousInput);
      // The error should not execute the malicious script
      expect(typeof result.toString()).toBe("string");
    });

    it("should handle object with malicious properties", () => {
      const maliciousObject = {
        toString: () => "Malicious toString",
      };

      const result = handleError(maliciousObject);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Malicious toString");
      expect(typeof result.toString()).toBe("string");
    });

    it("should not expose sensitive data in default message", () => {
      const sensitiveObject = {
        password: "secret123",
        token: "abc123",
        apiKey: "xyz789",
      };

      const result = handleError(sensitiveObject);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("[object Object]");
      expect(result.message).not.toContain("secret123");
      expect(result.message).not.toContain("abc123");
      expect(result.message).not.toContain("xyz789");
    });
  });

  describe("Type Safety", () => {
    it("should always return AppError instance", () => {
      const inputs = [
        new Error("Error"),
        "String error",
        null,
        undefined,
        {},
        42,
        false,
        [],
        () => {},
        /regex/,
        new Date(),
      ];

      const results = inputs.map(handleError);

      results.forEach((result) => {
        expect(result).toBeInstanceOf(AppError);
        expect(result).toBeInstanceOf(Error);
        expect(typeof result.code).toBe("string");
        expect(typeof result.message).toBe("string");
        expect(result.timestamp).toBeInstanceOf(Date);
      });
    });

    it("should have valid error codes", () => {
      const inputs = [new Error("Error"), "String error", null, undefined, {}, 42];

      const results = inputs.map(handleError);

      results.forEach((result) => {
        expect([
          "UNKNOWN_ERROR",
          "NETWORK_ERROR",
          "AUTH_ERROR",
          "VALIDATION_ERROR",
          "STORAGE_ERROR",
          "SYNC_ERROR",
          "NOT_FOUND",
          "PERMISSION_DENIED",
          "RATE_LIMITED",
        ]).toContain(result.code);
      });
    });
  });

  describe("Debugging Support", () => {
    it("should provide useful debugging information", () => {
      const originalError = new Error("Original error with stack");
      const result = handleError(originalError);

      // Should have all necessary information for debugging
      expect(result.code).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.stack).toBeDefined();
      expect(result.originalError).toBeDefined();
      expect(result.originalError?.stack).toBeDefined();
    });

    it("should handle errors without stack traces", () => {
      const originalError = new Error("Error without stack");
      (originalError as any).stack = undefined;

      const result = handleError(originalError);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Error without stack");
      expect(result.originalError).toBe(originalError);
      expect(result.originalError?.stack).toBeUndefined();
    });
  });
});
