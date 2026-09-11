/**
 * Unit tests for MockAuthDataSource
 */

import { MockAuthDataSource } from "../MockAuthDataSource";

describe("MockAuthDataSource", () => {
  let dataSource: MockAuthDataSource;

  beforeEach(() => {
    dataSource = new MockAuthDataSource();
  });

  describe("login", () => {
    it("should return success for any phone number", async () => {
      const result = await dataSource.login("+1234567890");

      expect(result).toEqual({ success: true });
    });
  });

  describe("verifyOtp", () => {
    it("should return dev token and user for a valid 6-digit OTP", async () => {
      const phone = "+1 1234567890";
      const result = await dataSource.verifyOtp(phone, "123456");

      expect(result.token).toMatch(/^dev-token-\d+$/);
      expect(result.user).toEqual({
        id: "user_dev",
        name: "Dev User",
        phone,
        isOnline: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should throw for invalid OTP", async () => {
      await expect(dataSource.verifyOtp("+1234567890", "12")).rejects.toThrow("Invalid OTP");
    });

    it("should throw for empty OTP", async () => {
      await expect(dataSource.verifyOtp("+1234567890", "")).rejects.toThrow("Invalid OTP");
    });

    it("should throw for OTP with letters", async () => {
      await expect(dataSource.verifyOtp("+1234567890", "abc123")).rejects.toThrow("Invalid OTP");
    });
  });
});
