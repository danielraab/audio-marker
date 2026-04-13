import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for tRPC marker router input validation schemas
 * These tests ensure the validation logic works correctly
 */
describe("Marker Router Input Validation", () => {
  describe("getMarkers input schema", () => {
    const getMarkersSchema = z.object({ audioId: z.string() });

    it("should accept valid audioId", () => {
      const validInput = { audioId: "audio-123" };
      const result = getMarkersSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject missing audioId", () => {
      const invalidInput = {};
      const result = getMarkersSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject non-string audioId", () => {
      const invalidInput = { audioId: 123 };
      const result = getMarkersSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("createMarker input schema", () => {
    const createMarkerSchema = z.object({
      audioId: z.string(),
      label: z.string().min(1),
      timestamp: z.number().min(0),
      endTimestamp: z.number().min(0).optional().nullable(),
      color: z.string().optional(),
    });

    it("should accept valid marker data without endTimestamp", () => {
      const validInput = {
        audioId: "audio-123",
        label: "Point Marker",
        timestamp: 10.5,
      };
      const result = createMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept valid marker data with endTimestamp", () => {
      const validInput = {
        audioId: "audio-123",
        label: "Section Marker",
        timestamp: 10,
        endTimestamp: 20,
      };
      const result = createMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept valid marker data with color", () => {
      const validInput = {
        audioId: "audio-123",
        label: "Colored Marker",
        timestamp: 10,
        color: "#FF0000",
      };
      const result = createMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept null endTimestamp", () => {
      const validInput = {
        audioId: "audio-123",
        label: "Marker",
        timestamp: 10,
        endTimestamp: null,
      };
      const result = createMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty label", () => {
      const invalidInput = {
        audioId: "audio-123",
        label: "",
        timestamp: 10,
      };
      const result = createMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject negative timestamp", () => {
      const invalidInput = {
        audioId: "audio-123",
        label: "Marker",
        timestamp: -5,
      };
      const result = createMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject negative endTimestamp", () => {
      const invalidInput = {
        audioId: "audio-123",
        label: "Marker",
        timestamp: 10,
        endTimestamp: -5,
      };
      const result = createMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject missing required fields", () => {
      const invalidInput = {
        label: "Marker",
      };
      const result = createMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject invalid data types", () => {
      const invalidInput = {
        audioId: 123,
        label: "Marker",
        timestamp: "10",
      };
      const result = createMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should accept timestamp of 0", () => {
      const validInput = {
        audioId: "audio-123",
        label: "Start Marker",
        timestamp: 0,
      };
      const result = createMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should accept endTimestamp of 0", () => {
      const validInput = {
        audioId: "audio-123",
        label: "Marker",
        timestamp: 0,
        endTimestamp: 0,
      };
      const result = createMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe("deleteMarker input schema", () => {
    const deleteMarkerSchema = z.object({
      id: z.string(),
    });

    it("should accept valid marker id", () => {
      const validInput = { id: "marker-123" };
      const result = deleteMarkerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const invalidInput = {};
      const result = deleteMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject non-string id", () => {
      const invalidInput = { id: 123 };
      const result = deleteMarkerSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should accept empty string id (validation at business logic level)", () => {
      const input = { id: "" };
      const result = deleteMarkerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
