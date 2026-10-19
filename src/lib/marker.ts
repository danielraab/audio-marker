import type { AudioMarker } from "~/types/Audio";

/**
 * Checks if a marker is a section (has both start and end timestamps)
 * @param marker - The marker to check
 * @returns true if the marker is a section, false if it's a point marker
 */
export function isSection(
  marker: AudioMarker,
): marker is AudioMarker & { endTimestamp: number } {
  return marker.endTimestamp != null && marker.endTimestamp > marker.timestamp;
}
