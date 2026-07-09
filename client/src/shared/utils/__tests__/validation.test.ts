// @ts-nocheck
/**
 * Unit tests for validation utility
 * Testing input validation and sanitization functions
 */

import {
  validatePhone,
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeInput,
} from "../validation";

describe("validation", () => {
  describe("validatePhone", () => {
    it("should validate valid phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "+1 (234) 567-890",
        "+44 20 7946 000",
        "+86 138 0013 8000",
        "1234567890",
        "(123) 456-7890",
      ];

      validPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhones = ["123", "abc123", "+1", "phone", "", null as any, undefined as any];

      invalidPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it("should normalize phone numbers", () => {
      const testCases = [
        { input: "+1 (234) 567-890", expected: "+1234567890" },
        { input: "(555) 123-4567", expected: "+5551234567" },
        { input: "555.123.4567", expected: "+5551234567" },
        { input: "555 123 4567", expected: "+5551234567" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validatePhone(input);
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(expected);
      });
    });

    it("should handle edge cases", () => {
      const result1 = validatePhone("+0123456789");
      const result2 = validatePhone("+1234567890123456");

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should validate valid emails", () => {
      const validEmails = [
        "user@example.com",
        "test.email+tag@domain.co.uk",
        "user_name@sub.domain.org",
        "firstname.lastname@company.com",
        "123@456.com",
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it("should reject invalid emails", () => {
      const invalidEmails = [
        "user@",
        "@domain.com",
        "user@.com",
        "user..name@domain.com",
        "user@domain",
        "user name@domain.com",
        "",
        null as any,
        undefined as any,
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it("should handle edge case emails", () => {
      const edgeCases = [
        "a@b.c", // Minimum valid email
        "very.long.email.address@domain.com",
        "user+tag+another@domain.com",
      ];

      edgeCases.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("validatePassword", () => {
    it("should validate strong passwords", () => {
      const strongPasswords = ["MyStr0ngP@ss!", "C0mpl3x#W0rd", "S3cur3P@ssw0rd", "Adm1n!2024"];

      strongPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
        expect(result.strength).toBe("strong");
      });
    });

    it("should reject weak passwords", () => {
      const weakPasswords = [
        "password",
        "123456",
        "qwerty",
        "abc",
        "",
        null as any,
        undefined as any,
      ];

      weakPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it("should validate password strength", () => {
      const testCases = [
        { input: "weak", expectedStrength: "weak" },
        { input: "medium123", expectedStrength: "medium" },
        { input: "Str0ngP@ss!", expectedStrength: "strong" },
      ];

      testCases.forEach(({ input, expectedStrength }) => {
        const result = validatePassword(input);
        expect(result.strength).toBe(expectedStrength);
      });
    });

    it("should check password requirements", () => {
      const requirements = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      };

      const testCases = [
        {
          input: "StrongPass123!",
          expected: {
            hasMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumbers: true,
            hasSpecialChars: true,
          },
        },
        {
          input: "weak",
          expected: {
            hasMinLength: false,
            hasUppercase: false,
            hasLowercase: true,
            hasNumbers: false,
            hasSpecialChars: false,
          },
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validatePassword(input, requirements);
        expect(result.requirements).toEqual(expected);
      });
    });
  });

  describe("validateUsername", () => {
    it("should validate valid usernames", () => {
      const validUsernames = [
        "john_doe",
        "user123",
        "test_user_2024",
        "jane_smith",
        "a",
        "user_with_underscores_and_numbers_123",
      ];

      validUsernames.forEach((username) => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it("should reject invalid usernames", () => {
      const invalidUsernames = [
        "",
        "a".repeat(51), // Too long
        "user@name", // Invalid character
        "user name", // Space
        null as any,
        undefined as any,
      ];

      invalidUsernames.forEach((username) => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it("should handle username edge cases", () => {
      const edgeCases = [
        "a", // Minimum length
        "a".repeat(50), // Maximum length
        "user_123_name",
      ];

      edgeCases.forEach((username) => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
      });
    });

    it("should normalize usernames", () => {
      const testCases = [
        { input: "  User_Name  ", expected: "User_Name" },
        { input: "john@doe", expected: "johndoe" }, // Removes invalid chars
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateUsername(input);
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(expected);
      });
    });
  });

  describe("sanitizeInput", () => {
    it("should sanitize HTML", () => {
      const testCases = [
        {
          input: '<script>alert("xss")</script>',
          expected: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          expected: "&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;",
        },
        { input: "Hello <b>world</b>", expected: "Hello &lt;b&gt;world&lt;/b&gt;" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeInput(input);
        expect(result).toBe(expected);
      });
    });

    it("should handle null/undefined", () => {
      const result1 = sanitizeInput(null as any);
      const result2 = sanitizeInput(undefined as any);

      expect(result1).toBe("");
      expect(result2).toBe("");
    });

    it("should remove dangerous patterns", () => {
      const dangerousInputs = [
        "javascript:",
        "data:",
        "vbscript:",
        "onload=",
        "onerror=",
        "onclick=",
      ];

      dangerousInputs.forEach((input) => {
        const result = sanitizeInput(input);
        expect(result).not.toContain(input);
      });
    });

    it("should preserve safe content", () => {
      const safeInputs = [
        "Hello, world!",
        "User @ mentioned #hashtag",
        "Check out https://example.com",
        "Price: $19.99",
      ];

      safeInputs.forEach((input) => {
        const result = sanitizeInput(input);
        expect(result).toContain(input);
      });
    });

    it("should handle special characters", () => {
      const testCases = [
        { input: "Hello & world", expected: "Hello &amp; world" },
        { input: 'Quote "test"', expected: "Quote &quot;test&quot;" },
        { input: "Apostrophe 'test'", expected: "Apostrophe &#x27;test&#x27;" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = sanitizeInput(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe("Performance", () => {
    it("should handle large inputs efficiently", () => {
      const largeInput = "a".repeat(10000);

      const startTime = Date.now();
      const result = validatePhone(largeInput);
      const endTime = Date.now();

      expect(result.isValid).toBe(false);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it("should handle batch validation efficiently", () => {
      const inputs = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);

      const startTime = Date.now();
      const results = inputs.map(validateEmail);
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(results.every((r) => r.isValid)).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe("Edge Cases", () => {
    it("should handle extreme inputs", () => {
      const extremeInputs = [
        "+".repeat(1000), // Very long phone
        "a".repeat(1000) + "@" + "b".repeat(1000) + ".com", // Very long email
        " ".repeat(1000), // Only spaces
        "\0".repeat(1000), // Null characters
      ];

      extremeInputs.forEach((input) => {
        const phoneResult = validatePhone(input);
        const emailResult = validateEmail(input);
        const passwordResult = validatePassword(input);
        const usernameResult = validateUsername(input);
        const sanitizeResult = sanitizeInput(input);

        // Should not crash and should return valid results
        expect(typeof phoneResult.isValid).toBe("boolean");
        expect(typeof emailResult.isValid).toBe("boolean");
        expect(typeof passwordResult.isValid).toBe("boolean");
        expect(typeof usernameResult.isValid).toBe("boolean");
        expect(typeof sanitizeResult).toBe("string");
      });
    });

    it("should handle unicode characters", () => {
      const unicodeInputs = [
        "用户@example.com", // Chinese
        "пользователь@example.com", // Russian
        "müller@example.com", // German umlaut
        "josé@example.com", // Spanish accent
        "user@例子.测试", // Chinese domain
      ];

      unicodeInputs.forEach((email) => {
        const result = validateEmail(email);
        // Unicode emails should be handled appropriately
        expect(typeof result.isValid).toBe("boolean");
        expect(typeof result.error).toBe("string" || "object" || "null");
      });
    });

    it("should handle international phone numbers", () => {
      const internationalPhones = [
        "+33 1 23 45 67 89", // France
        "+49 30 1234567", // Germany
        "+81 3 1234 5678", // Japan
        "+61 2 9876 5432", // Australia
        "+55 11 99999 9999", // Brazil
      ];

      internationalPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("Data Consistency", () => {
    it("should maintain consistent error messages", () => {
      const invalidInputs = ["", "invalid", null, undefined];

      invalidInputs.forEach((input) => {
        const phoneResult = validatePhone(input);
        const emailResult = validateEmail(input);
        const passwordResult = validatePassword(input);
        const usernameResult = validateUsername(input);

        // All invalid inputs should have error messages
        if (!phoneResult.isValid) {
          expect(phoneResult.error).toBeTruthy();
        }
        if (!emailResult.isValid) {
          expect(emailResult.error).toBeTruthy();
        }
        if (!passwordResult.isValid) {
          expect(passwordResult.error).toBeTruthy();
        }
        if (!usernameResult.isValid) {
          expect(usernameResult.error).toBeTruthy();
        }
      });
    });

    it("should handle type consistency", () => {
      const result = validatePhone("+1234567890");

      expect(typeof result.isValid).toBe("boolean");
      expect(typeof result.error).toBe("string" || "object" || "null");
      expect(typeof result.normalized).toBe("string" || "undefined");
    });

    it("should handle object immutability", () => {
      const input = "+1234567890";
      const result1 = validatePhone(input);
      const result2 = validatePhone(input);

      // Results should be equal but not the same reference
      expect(result1).toEqual(result2);
      if (result1.normalized && result2.normalized) {
        expect(result1.normalized).toBe(result2.normalized);
      }
    });
  });

  describe("Security", () => {
    it("should prevent code injection", () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        "data:text/html,<script>alert(1)</script>",
        'vbscript:msgbox("xss")',
      ];

      maliciousInputs.forEach((input) => {
        const sanitized = sanitizeInput(input);

        // Should not contain executable code
        expect(sanitized).not.toContain("<script>");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("data:");
        expect(sanitized).not.toContain("vbscript:");
      });
    });

    it("should handle SQL injection attempts", () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES('hacker'); --",
        "' UNION SELECT * FROM passwords --",
      ];

      sqlInjectionAttempts.forEach((input) => {
        const sanitized = sanitizeInput(input);

        // Should neutralize SQL injection attempts
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain(";");
        expect(sanitized).not.toContain("--");
      });
    });

    it("should preserve legitimate special characters", () => {
      const legitimateInputs = [
        "Hello & world!",
        "Price: $19.99",
        "Path: C:\\Users\\John",
        "Math: 2 + 2 = 4",
        'Quote: "Hello world"',
      ];

      legitimateInputs.forEach((input) => {
        const sanitized = sanitizeInput(input);

        // Should preserve legitimate special characters in encoded form
        expect(sanitized).toContain("Hello");
        expect(sanitized).toContain("world");
      });
    });
  });
});
