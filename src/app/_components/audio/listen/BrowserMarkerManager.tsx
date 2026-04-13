"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { FlagTriangleRight } from "lucide-react";
import type { AudioMarker } from "~/types/Audio";
import AddMarker from "../marker/AddMarker";
import MarkerList from "../marker/MarkerList";
import EmptyMarkerList from "../marker/EmptyMarkerList";

interface MarkerManagerProps {
  audioId: string;
  currentTime: number;
  onMarkersChange: (markers: AudioMarker[]) => void;
  onMarkerClick?: (marker: AudioMarker) => void;
  selectedRegion?: { start: number; end: number } | null;
  onClearRegion?: () => void;
  editingMarkerId?: string | null;
  onToggleEdit?: (markerId: string) => void;
  /** Called when BrowserMarkerManager is ready, passes update function to parent */
  onUpdateMarkerReady?: (
    updateFn: (
      markerId: string,
      updates: { timestamp: number; endTimestamp?: number | null },
    ) => void,
  ) => void;
}

export default function BrowserMarkerManager({
  audioId,
  currentTime,
  onMarkersChange,
  onMarkerClick,
  selectedRegion,
  onClearRegion,
  editingMarkerId,
  onToggleEdit,
  onUpdateMarkerReady,
}: MarkerManagerProps) {
  const [markers, setMarkers] = useState<AudioMarker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load markers from localStorage on component mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem(`audioMarkers_${audioId}`);
    if (savedMarkers) {
      try {
        const parsedMarkers = JSON.parse(savedMarkers) as AudioMarker[];
        setMarkers(parsedMarkers);
        onMarkersChange(parsedMarkers);
      } catch (error) {
        console.error("Error parsing saved markers:", error);
      }
    }
    setIsLoaded(true);
  }, [audioId, onMarkersChange]);

  // Save markers to localStorage whenever markers change (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(`audioMarkers_${audioId}`, JSON.stringify(markers));
    onMarkersChange(markers);
  }, [markers, audioId, onMarkersChange, isLoaded]);

  const removeMarker = (markerId: string) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== markerId));
  };

  const updateMarker = React.useCallback(
    (
      markerId: string,
      updates: { timestamp: number; endTimestamp?: number | null },
    ) => {
      setMarkers((prev) => {
        if (!prev.some((m) => m.id === markerId)) return prev;
        return prev
          .map((marker) =>
            marker.id === markerId
              ? {
                  ...marker,
                  timestamp: updates.timestamp,
                  endTimestamp: updates.endTimestamp ?? marker.endTimestamp,
                }
              : marker,
          )
          .sort((a, b) => a.timestamp - b.timestamp);
      });
    },
    [],
  );

  // Expose updateMarker to parent
  React.useEffect(() => {
    if (onUpdateMarkerReady) {
      onUpdateMarkerReady(updateMarker);
    }
  }, [onUpdateMarkerReady, updateMarker]);

  const handleToggleEdit = (markerId: string) => {
    onToggleEdit?.(markerId);
  };

  const addMarkerAtCurrentTime = (
    label: string,
    startTime: number,
    endTime?: number | null,
  ) => {
    const newMarker: AudioMarker = {
      id: `marker_${Date.now()}`,
      timestamp: startTime,
      label: label.trim() || `Browser Marker ${markers.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      endTimestamp: endTime,
    };

    setMarkers((prev) =>
      [...prev, newMarker].sort((a, b) => a.timestamp - b.timestamp),
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start">
        <div className="flex flex-row items-center gap-2 pb-2">
          <FlagTriangleRight size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Browser Audio Markers</h3>
          <Chip size="sm" variant="flat" color="primary">
            {markers.length}
          </Chip>
        </div>
        <p className="text-small text-default-500">
          This Markers are only available in this browser.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Add Custom Marker */}
        <div className="flex gap-2">
          <AddMarker
            currentTime={currentTime}
            onAddMarker={addMarkerAtCurrentTime}
            selectedRegion={selectedRegion ?? undefined}
            onClearRegion={onClearRegion}
          />
        </div>

        {/* Markers List */}
        {markers.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="text-sm font-medium text-default-600">
              Saved Markers:
            </h4>
            <MarkerList
              markers={markers}
              onMarkerClick={onMarkerClick}
              onRemoveMarker={removeMarker}
              onToggleEdit={handleToggleEdit}
              editingMarkerId={editingMarkerId}
            />
          </div>
        )}

        {markers.length === 0 && <EmptyMarkerList />}
      </CardBody>
    </Card>
  );
}
