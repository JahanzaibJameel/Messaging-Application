/**
 * Unit tests for formatters utility
 * Testing date/time formatting and other utility functions
 */

import { formatTime, formatDate, formatFileSize, formatDuration } from "../formatters";

describe("formatters", () => {
  describe("formatTime", () => {
    it("should format time correctly", () => {
      const date = new Date("2024-01-01T12:30:00Z");
      const result = formatTime(date);

      expect(result).toBe("12:30 PM");
    });

    it("should handle morning times", () => {
      const date = new Date("2024-01-01T09:15:00Z");
      const result = formatTime(date);

      expect(result).toBe("9:15 AM");
    });

    it("should handle midnight", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const result = formatTime(date);

      expect(result).toBe("12:00 AM");
    });

    it("should handle noon", () => {
      const date = new Date("2024-01-01T12:00:00Z");
      const result = formatTime(date);

      expect(result).toBe("12:00 PM");
    });

    it("should handle invalid dates", () => {
      const result = formatTime(new Date("invalid"));

      expect(result).toBe("Invalid Date");
    });

    it("should handle null/undefined", () => {
      const result1 = formatTime(null as any);
      const result2 = formatTime(undefined as any);

      expect(result1).toBe("Invalid Date");
      expect(result2).toBe("Invalid Date");
    });
  });

  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15T12:30:00Z");
      const result = formatDate(date);

      expect(result).toBe("January 15, 2024");
    });

    it("should handle different months", () => {
      const months = [
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-02-01T00:00:00Z"),
        new Date("2024-03-01T00:00:00Z"),
        new Date("2024-04-01T00:00:00Z"),
        new Date("2024-05-01T00:00:00Z"),
        new Date("2024-06-01T00:00:00Z"),
        new Date("2024-07-01T00:00:00Z"),
        new Date("2024-08-01T00:00:00Z"),
        new Date("2024-09-01T00:00:00Z"),
        new Date("2024-10-01T00:00:00Z"),
        new Date("2024-11-01T00:00:00Z"),
        new Date("2024-12-01T00:00:00Z"),
      ];

      const results = months.map(formatDate);

      expect(results).toEqual([
        "January 1, 2024",
        "February 1, 2024",
        "March 1, 2024",
        "April 1, 2024",
        "May 1, 2024",
        "June 1, 2024",
        "July 1, 2024",
        "August 1, 2024",
        "September 1, 2024",
        "October 1, 2024",
        "November 1, 2024",
        "December 1, 2024",
      ]);
    });

    it("should handle leap years", () => {
      const date = new Date("2024-02-29T00:00:00Z");
      const result = formatDate(date);

      expect(result).toBe("February 29, 2024");
    });

    it("should handle invalid dates", () => {
      const result = formatDate(new Date("invalid"));

      expect(result).toBe("Invalid Date");
    });

    it("should handle null/undefined", () => {
      const result1 = formatDate(null as any);
      const result2 = formatDate(undefined as any);

      expect(result1).toBe("Invalid Date");
      expect(result2).toBe("Invalid Date");
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      const result = formatFileSize(512);
      expect(result).toBe("512 B");
    });

    it("should format kilobytes correctly", () => {
      const result = formatFileSize(1536);
      expect(result).toBe("1.5 KB");
    });

    it("should format megabytes correctly", () => {
      const result = formatFileSize(2097152);
      expect(result).toBe("2.0 MB");
    });

    it("should format gigabytes correctly", () => {
      const result = formatFileSize(1073741824);
      expect(result).toBe("1.0 GB");
    });

    it("should handle zero size", () => {
      const result = formatFileSize(0);
      expect(result).toBe("0 B");
    });

    it("should handle negative sizes", () => {
      const result = formatFileSize(-1024);
      expect(result).toBe("-1.0 KB");
    });

    it("should handle very large files", () => {
      const result = formatFileSize(1099511627776);
      expect(result).toBe("1.0 TB");
    });

    it("should handle decimal precision", () => {
      const result = formatFileSize(1234567);
      expect(result).toBe("1.18 MB");
    });

    it("should handle null/undefined", () => {
      const result1 = formatFileSize(null as any);
      const result2 = formatFileSize(undefined as any);

      expect(result1).toBe("0 B");
      expect(result2).toBe("0 B");
    });
  });

  describe("formatDuration", () => {
    it("should format seconds correctly", () => {
      const result = formatDuration(45);
      expect(result).toBe("0:45");
    });

    it("should format minutes correctly", () => {
      const result = formatDuration(120);
      expect(result).toBe("2:00");
    });

    it("should format hours correctly", () => {
      const result = formatDuration(3600);
      expect(result).toBe("1:00:00");
    });

    it("should format hours and minutes correctly", () => {
      const result = formatDuration(3750);
      expect(result).toBe("1:02:30");
    });

    it("should format complex duration correctly", () => {
      const result = formatDuration(3661);
      expect(result).toBe("1:01:01");
    });

    it("should handle zero duration", () => {
      const result = formatDuration(0);
      expect(result).toBe("0:00");
    });

    it("should handle negative duration", () => {
      const result = formatDuration(-60);
      expect(result).toBe("-0:01:00");
    });

    it("should handle very long duration", () => {
      const result = formatDuration(90061);
      expect(result).toBe("25:01:01");
    });

    it("should handle null/undefined", () => {
      const result1 = formatDuration(null as any);
      const result2 = formatDuration(undefined as any);

      expect(result1).toBe("0:00");
      expect(result2).toBe("0:00");
    });
  });

  describe("Edge Cases", () => {
    it("should handle timezone differences", () => {
      const date1 = new Date("2024-01-01T00:00:00Z");
      const date2 = new Date("2024-01-01T00:00:00+05:00");

      const result1 = formatTime(date1);
      const result2 = formatTime(date2);

      // Should format based on local time
      expect(typeof result1).toBe("string");
      expect(typeof result2).toBe("string");
    });

    it("should handle date string inputs", () => {
      const result = formatDate("2024-01-01");

      expect(result).toBe("January 1, 2024");
    });

    it("should handle timestamp inputs", () => {
      const timestamp = 1704067200000; // 2024-01-01 00:00:00 UTC
      const result = formatDate(new Date(timestamp));

      expect(result).toBe("January 1, 2024");
    });

    it("should handle performance with large datasets", () => {
      const dates = Array.from({ length: 1000 }, (_, i) => new Date(2024, 0, i + 1));

      const startTime = Date.now();
      const results = dates.map(formatDate);
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Data Consistency", () => {
    it("should maintain consistent formatting", () => {
      const date = new Date("2024-01-01T12:30:00Z");

      const timeResult = formatTime(date);
      const dateResult = formatDate(date);

      expect(typeof timeResult).toBe("string");
      expect(typeof dateResult).toBe("string");
      expect(timeResult.length).toBeGreaterThan(0);
      expect(dateResult.length).toBeGreaterThan(0);
    });

    it("should handle special characters in dates", () => {
      const result = formatDate(new Date("2024-01-01T00:00:00.000Z"));

      expect(result).toBe("January 1, 2024");
    });

    it("should handle floating point precision", () => {
      const result = formatFileSize(1234.567);

      expect(result).toBe("1.21 KB");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed date objects", () => {
      const malformedDate = {
        getTime: () => NaN,
        toString: () => "Invalid Date",
      } as any;

      const timeResult = formatTime(malformedDate);
      const dateResult = formatDate(malformedDate);

      expect(timeResult).toBe("Invalid Date");
      expect(dateResult).toBe("Invalid Date");
    });

    it("should handle extremely large numbers", () => {
      const result = formatFileSize(Number.MAX_SAFE_INTEGER);

      expect(typeof result).toBe("string");
      expect(result).toContain("EB");
    });

    it("should handle extremely small numbers", () => {
      const result = formatFileSize(Number.MIN_SAFE_INTEGER);

      expect(typeof result).toBe("string");
      expect(result).toContain("EB");
    });
  });
});
