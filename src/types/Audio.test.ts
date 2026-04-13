import { describe, it, expect } from "vitest";
import type { AudioMarker } from "./Audio";

describe("Audio Types", () => {
  describe("AudioMarker interface", () => {
    it("should allow valid point marker (no endTimestamp)", () => {
      const pointMarker: AudioMarker = {
        id: "marker-1",
        timestamp: 10.5,
        label: "Important Point",
      };

      expect(pointMarker.id).toBe("marker-1");
      expect(pointMarker.timestamp).toBe(10.5);
      expect(pointMarker.endTimestamp).toBeUndefined();
      expect(pointMarker.label).toBe("Important Point");
    });

    it("should allow valid section marker (with endTimestamp)", () => {
      const sectionMarker: AudioMarker = {
        id: "marker-2",
        timestamp: 5,
        endTimestamp: 15,
        label: "Intro Section",
      };

      expect(sectionMarker.id).toBe("marker-2");
      expect(sectionMarker.timestamp).toBe(5);
      expect(sectionMarker.endTimestamp).toBe(15);
      expect(sectionMarker.label).toBe("Intro Section");
    });

    it("should allow null endTimestamp", () => {
      const marker: AudioMarker = {
        id: "marker-3",
        timestamp: 20,
        endTimestamp: null,
        label: "Point with null end",
      };

      expect(marker.endTimestamp).toBeNull();
    });

    it("should allow optional color property", () => {
      const coloredMarker: AudioMarker = {
        id: "marker-4",
        timestamp: 30,
        label: "Colored Marker",
        color: "#FF0000",
      };

      expect(coloredMarker.color).toBe("#FF0000");
    });

    it("should work without color property", () => {
      const marker: AudioMarker = {
        id: "marker-5",
        timestamp: 40,
        label: "No Color",
      };

      expect(marker.color).toBeUndefined();
    });

    it("should handle markers at timestamp 0", () => {
      const startMarker: AudioMarker = {
        id: "marker-start",
        timestamp: 0,
        endTimestamp: 10,
        label: "From Start",
      };

      expect(startMarker.timestamp).toBe(0);
    });

    it("should handle decimal timestamps", () => {
      const preciseMarker: AudioMarker = {
        id: "marker-precise",
        timestamp: 123.456,
        endTimestamp: 234.567,
        label: "Precise Timing",
      };

      expect(preciseMarker.timestamp).toBe(123.456);
      expect(preciseMarker.endTimestamp).toBe(234.567);
    });

    it("should handle very long labels", () => {
      const longLabel = "A".repeat(500);
      const marker: AudioMarker = {
        id: "marker-long",
        timestamp: 50,
        label: longLabel,
      };

      expect(marker.label).toHaveLength(500);
    });

    it("should handle special characters in label", () => {
      const specialMarker: AudioMarker = {
        id: "marker-special",
        timestamp: 60,
        label: 'Test: 你好 🎵 <script>alert("xss")</script>',
      };

      expect(specialMarker.label).toContain("你好");
      expect(specialMarker.label).toContain("🎵");
    });

    it("should allow hex color codes", () => {
      const hexMarker: AudioMarker = {
        id: "marker-hex",
        timestamp: 70,
        label: "Hex Color",
        color: "#1a2b3c",
      };

      expect(hexMarker.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("should allow RGB color strings", () => {
      const rgbMarker: AudioMarker = {
        id: "marker-rgb",
        timestamp: 80,
        label: "RGB Color",
        color: "rgb(255, 0, 0)",
      };

      expect(rgbMarker.color).toBe("rgb(255, 0, 0)");
    });
  });

  describe("AudioMarker edge cases", () => {
    it("should handle markers with same start and end timestamp", () => {
      const sameTimeMarker: AudioMarker = {
        id: "marker-same",
        timestamp: 100,
        endTimestamp: 100,
        label: "Same Time",
      };

      expect(sameTimeMarker.timestamp).toBe(sameTimeMarker.endTimestamp);
    });

    it("should handle markers with end before start", () => {
      // Type system allows this, but business logic should validate
      const reverseMarker: AudioMarker = {
        id: "marker-reverse",
        timestamp: 200,
        endTimestamp: 100,
        label: "Reverse Time",
      };

      expect(reverseMarker.endTimestamp).toBeLessThan(reverseMarker.timestamp);
    });

    it("should handle empty string as color", () => {
      const emptyColorMarker: AudioMarker = {
        id: "marker-empty-color",
        timestamp: 90,
        label: "Empty Color",
        color: "",
      };

      expect(emptyColorMarker.color).toBe("");
    });

    it("should handle very large timestamp values", () => {
      const largeMarker: AudioMarker = {
        id: "marker-large",
        timestamp: 999999.999,
        endTimestamp: 1000000,
        label: "Large Timestamp",
      };

      expect(largeMarker.timestamp).toBeGreaterThan(999999);
    });
  });
});
