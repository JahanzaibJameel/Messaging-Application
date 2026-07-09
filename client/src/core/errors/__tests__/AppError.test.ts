// @ts-nocheck
import { AppError, ErrorCode, ErrorDetails } from "../AppError";

describe("AppError", () => {
  describe("Constructor", () => {
    it("should create AppError with required fields", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network connection failed",
      });

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network connection failed");
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should create AppError with original error", () => {
      const originalError = new Error("Original error");
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network connection failed",
        originalError,
      });

      expect(error.originalError).toBe(originalError);
      expect(error.originalError?.message).toBe("Original error");
    });

    it("should create AppError with context", () => {
      const context = { url: "https://api.example.com", statusCode: 500 };
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network connection failed",
        context,
      });

      expect(error.context).toEqual(context);
      expect(error.context?.url).toBe("https://api.example.com");
      expect(error.context?.statusCode).toBe(500);
    });

    it("should create AppError with all fields", () => {
      const originalError = new Error("Original error");
      const context = { url: "https://api.example.com", statusCode: 500 };
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network connection failed",
        originalError,
        context,
      });

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network connection failed");
      expect(error.originalError).toBe(originalError);
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should have correct stack trace", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network connection failed",
      });

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("AppError");
    });
  });

  describe("Static Methods", () => {
    it("should create network error", () => {
      const error = AppError.network("Network failed");

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network failed");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create network error with original error", () => {
      const originalError = new Error("Connection timeout");
      const error = AppError.network("Network failed", originalError);

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network failed");
      expect(error.originalError).toBe(originalError);
    });

    it("should create auth error", () => {
      const error = AppError.auth("Authentication failed");

      expect(error.code).toBe("AUTH_ERROR");
      expect(error.message).toBe("Authentication failed");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create validation error", () => {
      const error = AppError.validation("Invalid input");

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create storage error", () => {
      const error = AppError.storage("Storage full");

      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.message).toBe("Storage full");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create sync error", () => {
      const error = AppError.sync("Sync failed");

      expect(error.code).toBe("SYNC_ERROR");
      expect(error.message).toBe("Sync failed");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create not found error", () => {
      const error = AppError.notFound("User");

      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("User not found");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create media error", () => {
      const error = AppError.media("Media processing failed");

      expect(error.code).toBe("UNKNOWN_ERROR");
      expect(error.message).toBe("Media processing failed");
      expect(error).toBeInstanceOf(AppError);
    });

    it("should create permission error", () => {
      const error = AppError.permission("Access denied");

      expect(error.code).toBe("PERMISSION_DENIED");
      expect(error.message).toBe("Access denied");
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("Error Properties", () => {
    it("should have readonly properties at compile time", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });

      // TypeScript readonly properties can still be modified at runtime
      // but TypeScript will prevent direct assignment
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network failed");
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should have timestamp set to creation time", () => {
      const beforeCreation = new Date();
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });
      const afterCreation = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe("Error Serialization", () => {
    it("should serialize to JSON correctly", () => {
      const originalError = new Error("Original error");
      const context = { url: "https://api.example.com" };
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        originalError,
        context,
      });

      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      expect(parsed.code).toBe("NETWORK_ERROR");
      expect(parsed.message).toBe("Network failed");
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.context).toEqual(context);
      // Note: originalError is not serialized by default
    });

    it("should handle circular references in context", () => {
      const context: any = { url: "https://api.example.com" };
      context.self = context; // Create circular reference

      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        context,
      });

      expect(() => {
        JSON.stringify(error);
      }).toThrow();
    });
  });

  describe("Error Comparison", () => {
    it("should compare errors by code", () => {
      const error1 = new AppError({ code: "NETWORK_ERROR", message: "Error 1" });
      const error2 = new AppError({ code: "NETWORK_ERROR", message: "Error 2" });
      const error3 = new AppError({ code: "AUTH_ERROR", message: "Error 3" });

      expect(error1.code).toBe(error2.code);
      expect(error1.code).not.toBe(error3.code);
    });

    it("should compare errors by message", () => {
      const error1 = new AppError({ code: "NETWORK_ERROR", message: "Same message" });
      const error2 = new AppError({ code: "AUTH_ERROR", message: "Same message" });
      const error3 = new AppError({ code: "NETWORK_ERROR", message: "Different message" });

      expect(error1.message).toBe(error2.message);
      expect(error1.message).not.toBe(error3.message);
    });
  });

  describe("Error Inheritance", () => {
    it("should be instance of Error", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });

      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it("should have Error prototype methods", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });

      expect(typeof error.toString).toBe("function");
      expect(typeof error.toJSON).toBe("function");
    });

    it("should work with try-catch", () => {
      try {
        throw new AppError({
          code: "NETWORK_ERROR",
          message: "Network failed",
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
        expect((error as AppError).code).toBe("NETWORK_ERROR");
        expect((error as AppError).message).toBe("Network failed");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty message", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "",
      });

      expect(error.message).toBe("");
    });

    it("should handle very long message", () => {
      const longMessage = "A".repeat(10000);
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: longMessage,
      });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it("should handle empty context", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        context: {},
      });

      expect(error.context).toEqual({});
    });

    it("should handle null original error", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        originalError: null as any,
      });

      expect(error.originalError).toBeNull();
    });

    it("should handle undefined original error", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        originalError: undefined,
      });

      expect(error.originalError).toBeUndefined();
    });
  });

  describe("Performance", () => {
    it("should create errors efficiently", () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        new AppError({
          code: "NETWORK_ERROR",
          message: `Error ${i}`,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should create static errors efficiently", () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        AppError.network(`Network error ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Type Safety", () => {
    it("should accept valid error codes", () => {
      const validCodes: ErrorCode[] = [
        "UNKNOWN_ERROR",
        "NETWORK_ERROR",
        "AUTH_ERROR",
        "VALIDATION_ERROR",
        "STORAGE_ERROR",
        "SYNC_ERROR",
        "NOT_FOUND",
        "PERMISSION_DENIED",
        "RATE_LIMITED",
      ];

      validCodes.forEach((code) => {
        expect(() => {
          new AppError({ code, message: "Test error" });
        }).not.toThrow();
      });
    });

    it("should have correct error code types", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });

      // TypeScript should enforce that code is of type ErrorCode
      expect(typeof error.code).toBe("string");
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
      ]).toContain(error.code);
    });
  });

  describe("Error Context", () => {
    it("should handle complex context objects", () => {
      const context = {
        request: {
          url: "https://api.example.com",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        response: {
          statusCode: 500,
          statusText: "Internal Server Error",
        },
        metadata: {
          requestId: "req_123",
          timestamp: "2024-01-01T00:00:00Z",
        },
      };

      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        context,
      });

      expect(error.context).toEqual(context);
      expect(error.context?.request.url).toBe("https://api.example.com");
      expect(error.context?.response.statusCode).toBe(500);
      expect(error.context?.metadata.requestId).toBe("req_123");
    });

    it("should handle context with various data types", () => {
      const context = {
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        nested: {
          prop: "value",
        },
      };

      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        context,
      });

      expect(error.context).toEqual(context);
    });
  });

  describe("Error Chaining", () => {
    it("should maintain error chain", () => {
      const originalError = new Error("Original error");
      const appError = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        originalError,
      });

      expect(appError.originalError).toBe(originalError);
      expect(appError.originalError?.message).toBe("Original error");
    });

    it("should handle nested error chains", () => {
      const rootError = new Error("Root error");
      const middleError = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        originalError: rootError,
      });
      const topError = new AppError({
        code: "SYNC_ERROR",
        message: "Sync failed",
        originalError: middleError,
      });

      expect(topError.originalError).toBe(middleError);
      expect((topError.originalError as AppError)?.originalError).toBe(rootError);
    });
  });

  describe("Security", () => {
    it("should not expose sensitive data in default toString", () => {
      const sensitiveContext = {
        password: "secret123",
        token: "abc123",
        apiKey: "xyz789",
      };

      const error = new AppError({
        code: "AUTH_ERROR",
        message: "Authentication failed",
        context: sensitiveContext,
      });

      const errorString = error.toString();

      // toString should not expose sensitive context by default
      expect(errorString).toContain("Authentication failed");
      expect(errorString).not.toContain("secret123");
      expect(errorString).not.toContain("abc123");
      expect(errorString).not.toContain("xyz789");
    });

    it("should handle malicious input in message", () => {
      const maliciousMessage = '<script>alert("xss")</script>';
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: maliciousMessage,
      });

      expect(error.message).toBe(maliciousMessage);
      // The error should not execute the malicious script
      expect(typeof error.toString()).toBe("string");
    });
  });

  describe("Debugging Support", () => {
    it("should provide useful debug information", () => {
      const originalError = new Error("Original error");
      const context = { url: "https://api.example.com", statusCode: 500 };
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
        originalError,
        context,
      });

      // Should have all necessary information for debugging
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(error.stack).toBeDefined();
      expect(error.originalError).toBeDefined();
      expect(error.context).toBeDefined();
    });

    it("should handle errors without stack traces", () => {
      const error = new AppError({
        code: "NETWORK_ERROR",
        message: "Network failed",
      });

      // Remove stack trace to test edge case
      (error as any).stack = undefined;

      expect(error.stack).toBeUndefined();
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network failed");
    });
  });
});
