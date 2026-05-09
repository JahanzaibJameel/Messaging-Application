/**
 * Basic test to verify Jest setup is working
 */

describe("Basic Test Setup", () => {
  it("should pass a simple test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle async operations", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it("should mock functions correctly", () => {
    const mockFn = jest.fn();
    mockFn("hello");
    expect(mockFn).toHaveBeenCalledWith("hello");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
