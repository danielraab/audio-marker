import { describe, it, expect } from "vitest";
import { formatTime, roundTime, formatTimeAgo } from "./time";

describe("Time Utilities", () => {
  describe("formatTime", () => {
    it("should format seconds to MM:SS format", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(30)).toBe("0:30");
      expect(formatTime(60)).toBe("1:00");
      expect(formatTime(90)).toBe("1:30");
      expect(formatTime(3661)).toBe("61:01");
    });

    it("should pad single digit seconds with zero", () => {
      expect(formatTime(65)).toBe("1:05");
      expect(formatTime(125)).toBe("2:05");
    });

    it("should handle large numbers correctly", () => {
      expect(formatTime(3599)).toBe("59:59");
      expect(formatTime(3600)).toBe("60:00");
      expect(formatTime(7200)).toBe("120:00");
    });

    it("should handle decimal seconds by flooring", () => {
      expect(formatTime(90.7)).toBe("1:30");
      expect(formatTime(65.99)).toBe("1:05");
    });
  });

  describe("roundTime", () => {
    it("should round to 2 decimals by default", () => {
      expect(roundTime(1.234)).toBe(1.23);
      expect(roundTime(1.235)).toBe(1.24);
      expect(roundTime(1.9999)).toBe(2.0);
    });

    it("should round to specified decimal places", () => {
      expect(roundTime(1.2345, 0)).toBe(1);
      expect(roundTime(1.2345, 1)).toBe(1.2);
      expect(roundTime(1.2345, 3)).toBe(1.235);
      expect(roundTime(1.2345, 4)).toBe(1.2345);
    });

    it("should handle whole numbers", () => {
      expect(roundTime(5)).toBe(5);
      expect(roundTime(5, 0)).toBe(5);
    });

    it("should handle negative numbers", () => {
      expect(roundTime(-1.234)).toBe(-1.23);
      expect(roundTime(-1.235)).toBe(-1.24);
    });
  });

  describe("formatTimeAgo", () => {
    it('should return "just now" for very recent times', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(formatTimeAgo(recent)).toBe("just now");
    });

    it("should format minutes ago", () => {
      const now = new Date();
      const minutes = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(formatTimeAgo(minutes)).toBe("5 minutes ago");

      const thirtyMinutes = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      expect(formatTimeAgo(thirtyMinutes)).toBe("30 minutes ago");
    });

    it("should format hours ago", () => {
      const now = new Date();
      const hours = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(formatTimeAgo(hours)).toBe("2 hours ago");

      const manyHours = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      expect(formatTimeAgo(manyHours)).toBe("12 hours ago");
    });

    it("should format days ago", () => {
      const now = new Date();
      const days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(formatTimeAgo(days)).toBe("3 days ago");

      const manyDays = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
      expect(formatTimeAgo(manyDays)).toBe("15 days ago");
    });

    it("should return formatted date for older dates", () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const result = formatTimeAgo(oldDate);
      // Should be a date string
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("should handle edge cases at boundaries", () => {
      const now = new Date();

      // Just under 1 minute
      const almostMinute = new Date(now.getTime() - 59 * 1000);
      expect(formatTimeAgo(almostMinute)).toBe("just now");

      // Just over 1 minute
      const justMinute = new Date(now.getTime() - 61 * 1000);
      expect(formatTimeAgo(justMinute)).toBe("1 minutes ago");

      // Just under 1 hour
      const almostHour = new Date(now.getTime() - 3599 * 1000);
      expect(formatTimeAgo(almostHour)).toBe("59 minutes ago");

      // Just over 1 hour
      const justHour = new Date(now.getTime() - 3601 * 1000);
      expect(formatTimeAgo(justHour)).toBe("1 hours ago");
    });
  });
});
