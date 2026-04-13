import { describe, it, expect } from "vitest";
import { isSection } from "./marker";
import type { AudioMarker } from "~/types/Audio";

describe("Marker Utilities", () => {
  describe("isSection", () => {
    it("should return true for markers with valid end timestamps", () => {
      const sectionMarker: AudioMarker = {
        id: "1",
        timestamp: 10,
        endTimestamp: 20,
        label: "Section 1",
      };
      expect(isSection(sectionMarker)).toBe(true);
    });

    it("should return false for point markers without end timestamps", () => {
      const pointMarker: AudioMarker = {
        id: "2",
        timestamp: 10,
        endTimestamp: null,
        label: "Point Marker",
      };
      expect(isSection(pointMarker)).toBe(false);
    });

    it("should return false when endTimestamp is undefined", () => {
      const pointMarker: AudioMarker = {
        id: "3",
        timestamp: 10,
        label: "Point Marker",
      };
      expect(isSection(pointMarker)).toBe(false);
    });

    it("should return false when endTimestamp equals timestamp", () => {
      const invalidSection: AudioMarker = {
        id: "4",
        timestamp: 10,
        endTimestamp: 10,
        label: "Invalid Section",
      };
      expect(isSection(invalidSection)).toBe(false);
    });

    it("should return false when endTimestamp is less than timestamp", () => {
      const invalidSection: AudioMarker = {
        id: "5",
        timestamp: 20,
        endTimestamp: 10,
        label: "Invalid Section",
      };
      expect(isSection(invalidSection)).toBe(false);
    });

    it("should handle markers with color property", () => {
      const coloredSection: AudioMarker = {
        id: "6",
        timestamp: 5,
        endTimestamp: 15,
        label: "Colored Section",
        color: "#FF0000",
      };
      expect(isSection(coloredSection)).toBe(true);
    });

    it("should work with very small time differences", () => {
      const tinySection: AudioMarker = {
        id: "7",
        timestamp: 10.5,
        endTimestamp: 10.51,
        label: "Tiny Section",
      };
      expect(isSection(tinySection)).toBe(true);
    });

    it("should work with large time ranges", () => {
      const largeSection: AudioMarker = {
        id: "8",
        timestamp: 0,
        endTimestamp: 3600,
        label: "Large Section",
      };
      expect(isSection(largeSection)).toBe(true);
    });
  });
});
