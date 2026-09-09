/**
 * Additional Formatters Tests
 * Tests for missing formatter functions
 */

import {
  formatChatListTime,
  formatMessageTime,
  formatRelativeTime,
  formatCalendarTime,
  formatPhoneNumber,
  truncateText,
  formatNumber,
  getInitials,
} from "../formatters";

describe("Additional Formatters", () => {
  describe("formatChatListTime", () => {
    const now = new Date();

    it("should return HH:mm for today", () => {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 5);
      const result = formatChatListTime(today);
      expect(result).toMatch(/^\d{1,2}:\d{2}$/);
    });

    it("should return 'Yesterday' for yesterday", () => {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 5);
      const result = formatChatListTime(yesterday);
      expect(result).toBe("Yesterday");
    });

    it("should return day name for this week", () => {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayThisWeek = new Date(now);
      mondayThisWeek.setDate(now.getDate() - daysFromMonday);
      mondayThisWeek.setHours(10, 0, 0, 0);

      if (daysFromMonday > 0) {
        const result = formatChatListTime(mondayThisWeek);
        expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
      }
    });

    it("should return MMM d for this year", () => {
      const earlierThisYear = new Date(now.getFullYear(), 0, 5); // Jan 5
      if (earlierThisYear < now) {
        const result = formatChatListTime(earlierThisYear);
        expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      }
    });

    it("should return MM/dd/yy for older dates", () => {
      const oldDate = new Date(now.getFullYear() - 1, 0, 5);
      const result = formatChatListTime(oldDate);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    });

    it("should handle string input", () => {
      const result = formatChatListTime("2024-01-15T14:05:00Z");
      expect(typeof result).toBe("string");
    });
  });

  describe("formatMessageTime", () => {
    it("should return HH:mm format", () => {
      const date = new Date("2024-01-15T14:05:00Z");
      const result = formatMessageTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should handle string input", () => {
      const result = formatMessageTime("2024-01-15T14:05:00Z");
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should handle midnight", () => {
      const date = new Date("2024-01-15T00:00:00Z");
      const result = formatMessageTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should handle noon", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const result = formatMessageTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("formatRelativeTime", () => {
    it("should return relative time string", () => {
      const past = new Date(Date.now() - 3600000); // 1 hour ago
      const result = formatRelativeTime(past);
      expect(result).toContain("hour");
      expect(result).toContain("ago");
    });

    it("should handle string input", () => {
      const result = formatRelativeTime("2024-01-15T14:05:00Z");
      expect(typeof result).toBe("string");
    });

    it("should handle very recent time", () => {
      const justNow = new Date(Date.now() - 10000); // 10 seconds ago
      const result = formatRelativeTime(justNow);
      expect(result).toContain("ago");
    });
  });

  describe("formatCalendarTime", () => {
    it("should return 'Today at HH:mm' for today", () => {
      const today = new Date();
      today.setHours(14, 5, 0, 0);
      const result = formatCalendarTime(today);
      expect(result).toMatch(/^Today at \d{2}:\d{2}$/);
    });

    it("should return 'Yesterday at HH:mm' for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 5, 0, 0);
      const result = formatCalendarTime(yesterday);
      expect(result).toMatch(/^Yesterday at \d{2}:\d{2}$/);
    });

    it("should return MM/dd/yy HH:mm for older dates", () => {
      const oldDate = new Date(2023, 0, 5, 14, 5);
      const result = formatCalendarTime(oldDate);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
    });

    it("should handle string input", () => {
      const result = formatCalendarTime("2024-01-15T14:05:00Z");
      expect(typeof result).toBe("string");
    });
  });

  describe("formatPhoneNumber", () => {
    it("should format 11-digit US number with country code", () => {
      const result = formatPhoneNumber("+12345678901");
      expect(result).toBe("+1 (234) 567-8901");
    });

    it("should format 11-digit number without +", () => {
      const result = formatPhoneNumber("12345678901");
      expect(result).toBe("+1 (234) 567-8901");
    });

    it("should format 10-digit US number", () => {
      const result = formatPhoneNumber("2345678901");
      expect(result).toBe("(234) 567-8901");
    });

    it("should handle phone with special characters", () => {
      const result = formatPhoneNumber("+1 (234) 567-8901");
      expect(result).toBe("+1 (234) 567-8901");
    });

    it("should return original for other lengths", () => {
      const result = formatPhoneNumber("123");
      expect(result).toBe("123");
    });

    it("should handle empty string", () => {
      const result = formatPhoneNumber("");
      expect(result).toBe("");
    });

    it("should handle international numbers", () => {
      const result = formatPhoneNumber("+442071234567");
      expect(result).toBe("+442071234567"); // Not 10 or 11 digits after cleaning
    });
  });

  describe("truncateText", () => {
    it("should return original text if shorter than maxLength", () => {
      const result = truncateText("Hello", 10);
      expect(result).toBe("Hello");
    });

    it("should truncate and add ellipsis", () => {
      const result = truncateText("Hello World", 8);
      expect(result).toBe("Hello Wo...");
    });

    it("should handle exact length", () => {
      const result = truncateText("Hello", 5);
      expect(result).toBe("Hello");
    });

    it("should handle empty string", () => {
      const result = truncateText("", 10);
      expect(result).toBe("");
    });

    it("should handle maxLength of 0", () => {
      const result = truncateText("Hello", 0);
      expect(result).toBe("...");
    });

    it("should handle maxLength of 1", () => {
      const result = truncateText("Hello", 1);
      expect(result).toBe("H...");
    });

    it("should handle maxLength of 2", () => {
      const result = truncateText("Hello", 2);
      expect(result).toBe("He...");
    });

    it("should handle maxLength of 3", () => {
      const result = truncateText("Hello", 3);
      expect(result).toBe("Hel...");
    });

    it("should handle unicode characters", () => {
      const result = truncateText("👋🌍 Hello", 5);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatNumber", () => {
    it("should format with thousands separator", () => {
      const result = formatNumber(1000);
      expect(result).toBe("1,000");
    });

    it("should format millions", () => {
      const result = formatNumber(1000000);
      expect(result).toBe("1,000,000");
    });

    it("should format billions", () => {
      const result = formatNumber(1000000000);
      expect(result).toBe("1,000,000,000");
    });

    it("should not format numbers under 1000", () => {
      const result = formatNumber(999);
      expect(result).toBe("999");
    });

    it("should handle zero", () => {
      const result = formatNumber(0);
      expect(result).toBe("0");
    });

    it("should handle negative numbers", () => {
      const result = formatNumber(-1000);
      expect(result).toBe("-1,000");
    });

    it("should handle decimal numbers", () => {
      const result = formatNumber(1234.56);
      expect(result).toBe("1,234.56");
    });
  });

  describe("getInitials", () => {
    it("should return first two initials from two names", () => {
      const result = getInitials("John Doe");
      expect(result).toBe("JD");
    });

    it("should return single initial for single name", () => {
      const result = getInitials("John");
      expect(result).toBe("J");
    });

    it("should handle three names", () => {
      const result = getInitials("John Michael Doe");
      expect(result).toBe("JM");
    });

    it("should handle multiple spaces", () => {
      const result = getInitials("John  Michael   Doe");
      expect(result).toBe("JM");
    });

    it("should convert to uppercase", () => {
      const result = getInitials("john doe");
      expect(result).toBe("JD");
    });

    it("should handle empty string", () => {
      const result = getInitials("");
      expect(result).toBe("");
    });

    it("should handle whitespace only", () => {
      const result = getInitials("   ");
      expect(result).toBe("");
    });

    it("should handle names with special characters", () => {
      const result = getInitials("Jean-Luc Picard");
      expect(result).toBe("JP");
    });

    it("should handle hyphenated names", () => {
      const result = getInitials("Mary-Jane Watson");
      expect(result).toBe("MW");
    });

    it("should limit to 2 characters", () => {
      const result = getInitials("A B C D E");
      expect(result).toBe("AB");
    });
  });
});
