export interface AudioMarker {
  id: string;
  timestamp: number;
  endTimestamp?: number | null; // if set, this is a section; otherwise a point marker
  label: string;
  color?: string;
}
