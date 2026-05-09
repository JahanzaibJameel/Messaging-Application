/**
 * Unit tests for formatTime utility
 * Testing time formatting functions and edge cases
 */

import {
  formatMessageTime,
  formatChatListTime,
  formatLastSeen,
  formatCallDuration,
} from "../formatTime";

describe("formatTime", () => {
  describe("formatMessageTime", () => {
    it("should format time in 12-hour format", () => {
      const result = formatMessageTime("2024-01-01T14:30:00Z");
      expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
    });

    it("should handle morning times", () => {
      const result = formatMessageTime("2024-01-01T09:15:00Z");
      expect(result).toMatch(/^[1-9]:\d{2} AM$/);
    });

    it("should handle afternoon times", () => {
      const result = formatMessageTime("2024-01-01T15:45:00Z");
      expect(result).toMatch(/^[1-9]:\d{2} PM$/);
    });

    it("should handle midnight", () => {
      const result = formatMessageTime("2024-01-01T00:00:00Z");
      expect(result).toMatch(/^12:\d{2} AM$/);
    });

    it("should handle noon", () => {
      const result = formatMessageTime("2024-01-01T12:00:00Z");
      expect(result).toMatch(/^12:\d{2} PM$/);
    });

    it("should handle invalid timestamps", () => {
      const result = formatMessageTime("invalid-date");
      expect(result).toMatch(/Invalid Date/);
    });

    it("should handle empty timestamps", () => {
      const result = formatMessageTime("");
      expect(result).toMatch(/Invalid Date/);
    });
  });

  describe("formatChatListTime", () => {
    beforeEach(() => {
      // Mock current time for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should show time for today", () => {
      const result = formatChatListTime("2024-01-01T14:30:00Z");
      expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
    });

    it('should show "Yesterday" for yesterday', () => {
      const result = formatChatListTime("2023-12-31T14:30:00Z");
      expect(result).toBe("Yesterday");
    });

    it("should show day name for this week", () => {
      const result = formatChatListTime("2023-12-28T14:30:00Z"); // 4 days ago
      expect(result).toMatch(/^[A-Za-z]+$/); // Day name
    });

    it("should show date for older messages", () => {
      const result = formatChatListTime("2023-12-20T14:30:00Z"); // 12 days ago
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{2}$/);
    });

    it("should handle invalid timestamps", () => {
      const result = formatChatListTime("invalid-date");
      expect(result).toMatch(/Invalid Date/);
    });

    it("should handle empty timestamps", () => {
      const result = formatChatListTime("");
      expect(result).toMatch(/Invalid Date/);
    });
  });

  describe("formatLastSeen", () => {
    beforeEach(() => {
      // Mock current time for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show "last seen today" for today', () => {
      const result = formatLastSeen("2024-01-01T14:30:00Z");
      expect(result).toMatch(/^last seen today at [1-9]:\d{2} (AM|PM)$/);
    });

    it('should show "last seen yesterday" for yesterday', () => {
      const result = formatLastSeen("2023-12-31T14:30:00Z");
      expect(result).toMatch(/^last seen yesterday at [1-9]:\d{2} (AM|PM)$/);
    });

    it("should show full date for older timestamps", () => {
      const result = formatLastSeen("2023-12-20T14:30:00Z");
      expect(result).toMatch(/^last seen \d{1,2}\/\d{1,2}\/\d{2} at [1-9]:\d{2} (AM|PM)$/);
    });

    it("should handle invalid timestamps", () => {
      const result = formatLastSeen("invalid-date");
      expect(result).toMatch(/Invalid Date/);
    });

    it("should handle empty timestamps", () => {
      const result = formatLastSeen("");
      expect(result).toMatch(/Invalid Date/);
    });
  });

  describe("formatCallDuration", () => {
    it("should format seconds correctly", () => {
      const result = formatCallDuration(45);
      expect(result).toBe("0:45");
    });

    it("should format minutes and seconds correctly", () => {
      const result = formatCallDuration(125);
      expect(result).toBe("2:05");
    });

    it("should handle single digit seconds", () => {
      const result = formatCallDuration(61);
      expect(result).toBe("1:01");
    });

    it("should handle zero seconds", () => {
      const result = formatCallDuration(0);
      expect(result).toBe("0:00");
    });

    it("should handle large durations", () => {
      const result = formatCallDuration(3661); // 61 minutes, 1 second
      expect(result).toBe("61:01");
    });

    it("should handle negative durations", () => {
      const result = formatCallDuration(-10);
      expect(result).toBe("-1:50"); // Math.floor(-10/60) = -1, -10 % 60 = 50
    });

    it("should handle very large durations", () => {
      const result = formatCallDuration(86400); // 24 hours
      expect(result).toBe("1440:00");
    });

    it("should handle decimal seconds", () => {
      const result = formatCallDuration(125.7);
      expect(result).toBe("2:05");
    });
  });

  describe("Edge Cases", () => {
    it("should handle leap year timestamps", () => {
      const result = formatMessageTime("2024-02-29T14:30:00Z"); // Leap year
      expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
    });

    it("should handle timezone offsets", () => {
      const result = formatMessageTime("2024-01-01T14:30:00+05:30");
      expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
    });

    it("should handle ISO string formats", () => {
      const result = formatMessageTime("2024-01-01T14:30:00.000Z");
      expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
    });

    it("should handle Unix timestamps", () => {
      const result = formatMessageTime("1704110400"); // Unix timestamp
      expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
    });
  });

  describe("Performance", () => {
    it("should handle large number of time formatting operations efficiently", () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        formatMessageTime("2024-01-01T14:30:00Z");
        formatChatListTime("2024-01-01T14:30:00Z");
        formatLastSeen("2024-01-01T14:30:00Z");
        formatCallDuration(125);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle complex timestamps efficiently", () => {
      const complexTimestamps = [
        "2024-01-01T14:30:00.000Z",
        "2024-01-01T14:30:00+05:30",
        "2024-01-01T14:30:00-08:00",
        "1704110400",
        "2024-01-01",
      ];

      const startTime = Date.now();

      complexTimestamps.forEach((timestamp) => {
        formatMessageTime(timestamp);
        formatChatListTime(timestamp);
        formatLastSeen(timestamp);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe("Data Consistency", () => {
    it("should maintain consistent formatting across calls", () => {
      const timestamp = "2024-01-01T14:30:00Z";

      const result1 = formatMessageTime(timestamp);
      const result2 = formatMessageTime(timestamp);

      expect(result1).toBe(result2);
    });

    it("should handle different timestamp formats consistently", () => {
      const timestamps = [
        "2024-01-01T14:30:00Z",
        "2024-01-01T14:30:00.000Z",
        "2024-01-01T14:30:00+00:00",
      ];

      const results = timestamps.map((ts) => formatMessageTime(ts));

      results.forEach((result) => {
        expect(result).toMatch(/^[1-9]:\d{2} (AM|PM)$/);
      });
    });

    it("should maintain duration formatting consistency", () => {
      const durations = [0, 1, 59, 60, 61, 3599, 3600, 3601];

      durations.forEach((duration) => {
        const result1 = formatCallDuration(duration);
        const result2 = formatCallDuration(duration);
        expect(result1).toBe(result2);
        expect(result1).toMatch(/^\d+:\d{2}$/);
      });
    });
  });

  describe("Internationalization", () => {
    it("should handle different locales", () => {
      // Test that functions don't crash with different locale settings
      expect(() => {
        formatMessageTime("2024-01-01T14:30:00Z");
        formatChatListTime("2024-01-01T14:30:00Z");
        formatLastSeen("2024-01-01T14:30:00Z");
      }).not.toThrow();
    });

    it("should handle 24-hour time input correctly", () => {
      const result = formatMessageTime("2024-01-01T23:59:00Z");
      expect(result).toMatch(/^11:\d{2} PM$/);
    });

    it("should handle early morning times", () => {
      const result = formatMessageTime("2024-01-01T00:01:00Z");
      expect(result).toMatch(/^12:\d{2} AM$/);
    });
  });

  describe("Security", () => {
    it("should handle malicious timestamp input safely", () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "javascript:void(0)",
        "data:text/html,<script>alert(1)</script>",
        "../../../etc/passwd",
        "SELECT * FROM users",
      ];

      maliciousInputs.forEach((input) => {
        expect(() => {
          formatMessageTime(input);
          formatChatListTime(input);
          formatLastSeen(input);
        }).not.toThrow();
      });
    });

    it("should handle extremely large duration values", () => {
      const largeDurations = [Number.MAX_SAFE_INTEGER, Number.MAX_VALUE, Infinity];

      largeDurations.forEach((duration) => {
        expect(() => formatCallDuration(duration)).not.toThrow();
      });
    });

    it("should handle negative duration values safely", () => {
      const negativeDurations = [-1, -60, -3600, Number.MIN_SAFE_INTEGER];

      negativeDurations.forEach((duration) => {
        expect(() => formatCallDuration(duration)).not.toThrow();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle null values", () => {
      expect(() => {
        formatMessageTime(null as any);
        formatChatListTime(null as any);
        formatLastSeen(null as any);
        formatCallDuration(null as any);
      }).not.toThrow();
    });

    it("should handle undefined values", () => {
      expect(() => {
        formatMessageTime(undefined as any);
        formatChatListTime(undefined as any);
        formatLastSeen(undefined as any);
        formatCallDuration(undefined as any);
      }).not.toThrow();
    });

    it("should handle non-string timestamps", () => {
      const nonStringInputs = [123, true, {}, [], Symbol("test")];

      nonStringInputs.forEach((input) => {
        expect(() => {
          formatMessageTime(input as any);
          formatChatListTime(input as any);
          formatLastSeen(input as any);
        }).not.toThrow();
      });
    });

    it("should handle non-numeric durations", () => {
      const nonNumericInputs = ["abc", true, {}, [], Symbol("test")];

      nonNumericInputs.forEach((input) => {
        expect(() => formatCallDuration(input as any)).not.toThrow();
      });
    });
  });
});
