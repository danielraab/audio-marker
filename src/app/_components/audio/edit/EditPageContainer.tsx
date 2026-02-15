'use client';

import { useState, useCallback } from 'react';
import { api } from "~/trpc/react";
import { StoredMarkerManager } from './StoredMarkerManager';
import AudioPlayer from '../AudioPlayer';
import type { AudioMarker } from '~/types/Audio';

interface EditPageContainerProps {
  audioId: string;
}

export function EditPageContainer({ audioId }: EditPageContainerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playFromFunction, setPlayFromFunction] = useState<((marker: AudioMarker) => void) | null>(null);
  const [clearRegionFunction, setClearRegionFunction] = useState<(() => void) | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);

  const utils = api.useUtils();
  const [audio] = api.audio.getUserAudioById.useSuspenseQuery({ id: audioId });
  const [markers] = api.marker.getMarkers.useSuspenseQuery({ audioId });

  const updateMarker = api.marker.updateMarker.useMutation({
    onSuccess: () => {
      void utils.marker.getMarkers.invalidate({ audioId });
    },
  });

  //for player -> marker manager
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);
  
  const handleSelectedRegionUpdate = useCallback((start: number | null, end: number | null) => {
    setSelectedRegion({ start, end });
  }, []);
  
  const handleClearRegionReady = useCallback((clearRegion: () => void) => {
    setClearRegionFunction(() => clearRegion);
  }, []);

  const handlePlayFromFnReady = useCallback((seekTo: (marker: AudioMarker) => void) => {
    setPlayFromFunction(() => seekTo);
  }, []);

  // from marker manager -> player
  const handleMarkerClick = useCallback((marker: AudioMarker) => {
    if (playFromFunction) {
      playFromFunction(marker);
    }
  }, [playFromFunction]);

  // Handle marker updates from dragging/resizing in wavesurfer - save immediately
  const handleMarkerUpdated = useCallback((markerId: string, updates: { timestamp: number; endTimestamp?: number | null }) => {
    updateMarker.mutate({
      id: markerId,
      timestamp: updates.timestamp,
      endTimestamp: updates.endTimestamp,
    });
  }, [updateMarker]);

  // Toggle edit mode for a marker - just toggles state, saving happens immediately on drag
  const handleToggleEdit = useCallback((markerId: string) => {
    if (editingMarkerId === markerId) {
      setEditingMarkerId(null);
    } else {
      setEditingMarkerId(markerId);
    }
  }, [editingMarkerId]);

  return (
    <div className="w-full flex flex-col items-center mx-auto space-y-6">
      
      <AudioPlayer
        audioUrl={`/api/audio/${audio.id}/file`}
        peaksUrl={`/api/audio/${audio.id}/peaks`}
        audioName={audio.name}
        audioReadOnlyToken={audio.id}
        markers={markers}
        onTimeUpdate={handleTimeUpdate}
        onPlayFromFnReady={handlePlayFromFnReady}
        onSelectedRegionUpdate={handleSelectedRegionUpdate}
        onClearRegionReady={handleClearRegionReady}
        editingMarkerId={editingMarkerId}
        onMarkerUpdated={handleMarkerUpdated}
      />

      <StoredMarkerManager
        audioId={audioId}
        currentTime={currentTime}
        markers={markers}
        onMarkerClick={handleMarkerClick}
        selectedRegion={selectedRegion}
        onClearRegion={clearRegionFunction}
        editingMarkerId={editingMarkerId}
        onToggleEdit={handleToggleEdit}
      />
    </div>
  );
}