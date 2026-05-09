import { AppError, withErrorHandling } from "../AppError";

describe("withErrorHandling", () => {
  describe("Successful Execution", () => {
    it("should return result when function succeeds", async () => {
      const successFunction = async () => "success result";

      const result = await withErrorHandling(successFunction);

      expect(result).toBe("success result");
    });

    it("should return result when function returns number", async () => {
      const successFunction = async () => 42;

      const result = await withErrorHandling(successFunction);

      expect(result).toBe(42);
    });

    it("should return result when function returns object", async () => {
      const successFunction = async () => ({ id: 1, name: "test" });

      const result = await withErrorHandling(successFunction);

      expect(result).toEqual({ id: 1, name: "test" });
    });

    it("should return result when function returns array", async () => {
      const successFunction = async () => [1, 2, 3];

      const result = await withErrorHandling(successFunction);

      expect(result).toEqual([1, 2, 3]);
    });

    it("should return result when function returns null", async () => {
      const successFunction = async () => null;

      const result = await withErrorHandling(successFunction);

      expect(result).toBeNull();
    });

    it("should return result when function returns undefined", async () => {
      const successFunction = async () => undefined;

      const result = await withErrorHandling(successFunction);

      expect(result).toBeUndefined();
    });

    it("should handle synchronous function", async () => {
      const syncFunction = () => Promise.resolve("sync result");

      const result = await withErrorHandling(syncFunction);

      expect(result).toBe("sync result");
    });
  });

  describe("Error Handling", () => {
    it("should return undefined when function throws AppError", async () => {
      const errorFunction = async () => {
        throw new AppError({
          code: "NETWORK_ERROR",
          message: "Network failed",
        });
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws Error", async () => {
      const errorFunction = async () => {
        throw new Error("Standard error");
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws string", async () => {
      const errorFunction = async () => {
        throw "String error";
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws object", async () => {
      const errorFunction = async () => {
        throw { type: "error", message: "Object error" };
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws null", async () => {
      const errorFunction = async () => {
        throw null;
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws undefined", async () => {
      const errorFunction = async () => {
        throw undefined;
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws number", async () => {
      const errorFunction = async () => {
        throw 404;
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });

    it("should return undefined when function throws boolean", async () => {
      const errorFunction = async () => {
        throw false;
      };

      const result = await withErrorHandling(errorFunction);

      expect(result).toBeUndefined();
    });
  });

  describe("Custom Error Handler", () => {
    it("should call custom error handler with AppError", async () => {
      const mockErrorHandler = jest.fn();
      const errorFunction = async () => {
        throw new AppError({
          code: "NETWORK_ERROR",
          message: "Network failed",
        });
      };

      const result = await withErrorHandling(errorFunction, mockErrorHandler);

      expect(result).toBeUndefined();
      expect(mockErrorHandler).toHaveBeenCalledTimes(1);
      expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockErrorHandler.mock.calls[0][0].code).toBe("NETWORK_ERROR");
      expect(mockErrorHandler.mock.calls[0][0].message).toBe("Network failed");
    });

    it("should call custom error handler with converted Error", async () => {
      const mockErrorHandler = jest.fn();
      const errorFunction = async () => {
        throw new Error("Standard error");
      };

      const result = await withErrorHandling(errorFunction, mockErrorHandler);

      expect(result).toBeUndefined();
      expect(mockErrorHandler).toHaveBeenCalledTimes(1);
      expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockErrorHandler.mock.calls[0][0].code).toBe("UNKNOWN_ERROR");
      expect(mockErrorHandler.mock.calls[0][0].message).toBe("Standard error");
      expect(mockErrorHandler.mock.calls[0][0].originalError).toBeInstanceOf(Error);
    });

    it("should call custom error handler with converted string error", async () => {
      const mockErrorHandler = jest.fn();
      const errorFunction = async () => {
        throw "String error";
      };

      const result = await withErrorHandling(errorFunction, mockErrorHandler);

      expect(result).toBeUndefined();
      expect(mockErrorHandler).toHaveBeenCalledTimes(1);
      expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockErrorHandler.mock.calls[0][0].code).toBe("UNKNOWN_ERROR");
      expect(mockErrorHandler.mock.calls[0][0].message).toBe("String error");
    });

    it("should call custom error handler even if it throws", async () => {
      const errorHandler = jest.fn(() => {
        throw new Error("Error handler failed");
      });
      const errorFunction = async () => {
        throw new Error("Original error");
      };

      // Should still call error handler even if it throws
      await expect(withErrorHandling(errorFunction, errorHandler)).rejects.toThrow(
        "Error handler failed"
      );
      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it("should not call error handler on success", async () => {
      const mockErrorHandler = jest.fn();
      const successFunction = async () => "success";

      const result = await withErrorHandling(successFunction, mockErrorHandler);

      expect(result).toBe("success");
      expect(mockErrorHandler).not.toHaveBeenCalled();
    });
  });

  describe("Async Function Types", () => {
    it("should handle Promise that resolves", async () => {
      const promiseFunction = () => Promise.resolve("resolved value");

      const result = await withErrorHandling(promiseFunction);

      expect(result).toBe("resolved value");
    });

    it("should handle Promise that rejects with Error", async () => {
      const promiseFunction = () => Promise.reject(new Error("Rejected error"));

      const result = await withErrorHandling(promiseFunction);

      expect(result).toBeUndefined();
    });

    it("should handle Promise that rejects with string", async () => {
      const promiseFunction = () => Promise.reject("Rejected string");

      const result = await withErrorHandling(promiseFunction);

      expect(result).toBeUndefined();
    });

    it("should handle Promise that rejects with object", async () => {
      const promiseFunction = () => Promise.reject({ error: "Rejected object" });

      const result = await withErrorHandling(promiseFunction);

      expect(result).toBeUndefined();
    });

    it("should handle async function with await", async () => {
      const asyncFunction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async result";
      };

      const result = await withErrorHandling(asyncFunction);

      expect(result).toBe("async result");
    });

    it("should handle async function that throws after await", async () => {
      const asyncFunction = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error("Async error");
      };

      const result = await withErrorHandling(asyncFunction);

      expect(result).toBeUndefined();
    });
  });

  describe("Performance", () => {
    it("should handle multiple concurrent executions efficiently", async () => {
      const successFunction = async (id: number) => `result_${id}`;

      const promises = Array.from({ length: 100 }, (_, i) =>
        withErrorHandling(() => successFunction(i))
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(results.every((result, index) => result === `result_${index}`)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle multiple error cases efficiently", async () => {
      const errorFunction = async (id: number) => {
        throw new Error(`Error ${id}`);
      };

      const promises = Array.from({ length: 100 }, (_, i) =>
        withErrorHandling(() => errorFunction(i))
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(results.every((result) => result === undefined)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Edge Cases", () => {
    it("should handle function that returns Promise of different types", async () => {
      const stringFunction = () => Promise.resolve("string");
      const numberFunction = () => Promise.resolve(42);
      const objectFunction = () => Promise.resolve({ key: "value" });
      const arrayFunction = () => Promise.resolve([1, 2, 3]);
      const nullFunction = () => Promise.resolve(null);
      const undefinedFunction = () => Promise.resolve(undefined);

      const stringResult = await withErrorHandling(stringFunction);
      const numberResult = await withErrorHandling(numberFunction);
      const objectResult = await withErrorHandling(objectFunction);
      const arrayResult = await withErrorHandling(arrayFunction);
      const nullResult = await withErrorHandling(nullFunction);
      const undefinedResult = await withErrorHandling(undefinedFunction);

      expect(stringResult).toBe("string");
      expect(numberResult).toBe(42);
      expect(objectResult).toEqual({ key: "value" });
      expect(arrayResult).toEqual([1, 2, 3]);
      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    it("should handle function that throws different error types", async () => {
      const errors = [
        new Error("Standard error"),
        new TypeError("Type error"),
        new ReferenceError("Reference error"),
        "String error",
        { object: "error" },
        404,
        false,
        null,
        undefined,
      ];

      const results = await Promise.all(
        errors.map((error) =>
          withErrorHandling(() => {
            throw error;
          })
        )
      );

      expect(results).toHaveLength(9);
      expect(results.every((result) => result === undefined)).toBe(true);
    });

    it("should handle function that returns immediately", async () => {
      const immediateFunction = () => Promise.resolve("immediate");

      const result = await withErrorHandling(immediateFunction);

      expect(result).toBe("immediate");
    });

    it("should handle function that never resolves (timeout simulation)", async () => {
      // Note: This test might take a while, so we'll use a timeout
      const neverResolvesFunction = () => new Promise(() => {});

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 100)
      );

      await expect(
        Promise.race([withErrorHandling(neverResolvesFunction), timeoutPromise])
      ).rejects.toThrow("Timeout");
    });
  });

  describe("Type Safety", () => {
    it("should preserve return type correctly", async () => {
      const stringFunction = async () => "string";
      const numberFunction = async () => 42;
      const booleanFunction = async () => true;
      const objectFunction = async () => ({ key: "value" });
      const arrayFunction = async () => [1, 2, 3];

      const stringResult = await withErrorHandling(stringFunction);
      const numberResult = await withErrorHandling(numberFunction);
      const booleanResult = await withErrorHandling(booleanFunction);
      const objectResult = await withErrorHandling(objectFunction);
      const arrayResult = await withErrorHandling(arrayFunction);

      expect(typeof stringResult).toBe("string");
      expect(typeof numberResult).toBe("number");
      expect(typeof booleanResult).toBe("boolean");
      expect(typeof objectResult).toBe("object");
      expect(Array.isArray(arrayResult)).toBe(true);
    });

    it("should return undefined for all error cases", async () => {
      const errorFunctions = [
        () => {
          throw new Error("Error");
        },
        () => {
          throw "String";
        },
        () => {
          throw {};
        },
        () => {
          throw 42;
        },
        () => {
          throw false;
        },
      ];

      const results = await Promise.all(errorFunctions.map((fn) => withErrorHandling(fn)));

      expect(results.every((result) => result === undefined)).toBe(true);
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory with repeated calls", async () => {
      const successFunction = async () => "success";

      // Make many calls to test for memory leaks
      const promises = Array.from({ length: 1000 }, () => withErrorHandling(successFunction));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(1000);
      expect(results.every((result) => result === "success")).toBe(true);
    });

    it("should not leak memory with repeated errors", async () => {
      const errorFunction = async () => {
        throw new Error("Error");
      };

      // Make many calls that throw errors
      const promises = Array.from({ length: 1000 }, () => withErrorHandling(errorFunction));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(1000);
      expect(results.every((result) => result === undefined)).toBe(true);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle API call simulation", async () => {
      const mockApiCall = async (shouldFail = false) => {
        if (shouldFail) {
          throw new Error("API call failed");
        }
        return { data: "api response", status: 200 };
      };

      const successResult = await withErrorHandling(() => mockApiCall(false));
      const failResult = await withErrorHandling(() => mockApiCall(true));

      expect(successResult).toEqual({ data: "api response", status: 200 });
      expect(failResult).toBeUndefined();
    });

    it("should handle database operation simulation", async () => {
      const mockDbOperation = async (operation: string) => {
        if (operation === "read") {
          return { id: 1, name: "User 1" };
        } else if (operation === "write") {
          throw new Error("Database write failed");
        }
        throw new Error("Unknown operation");
      };

      const readResult = await withErrorHandling(() => mockDbOperation("read"));
      const writeResult = await withErrorHandling(() => mockDbOperation("write"));
      const unknownResult = await withErrorHandling(() => mockDbOperation("unknown"));

      expect(readResult).toEqual({ id: 1, name: "User 1" });
      expect(writeResult).toBeUndefined();
      expect(unknownResult).toBeUndefined();
    });

    it("should handle file operation simulation", async () => {
      const mockFileOperation = async (filename: string) => {
        if (filename.startsWith("valid_")) {
          return `Content of ${filename}`;
        } else {
          throw new Error(`File not found: ${filename}`);
        }
      };

      const validResult = await withErrorHandling(() => mockFileOperation("valid_file.txt"));
      const invalidResult = await withErrorHandling(() => mockFileOperation("invalid_file.txt"));

      expect(validResult).toBe("Content of valid_file.txt");
      expect(invalidResult).toBeUndefined();
    });
  });
});
