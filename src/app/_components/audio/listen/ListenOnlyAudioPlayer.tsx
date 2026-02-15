'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import AudioPlayer from '../AudioPlayer';
import BrowserMarkerManager from './BrowserMarkerManager';
import type { AudioMarker } from '~/types/Audio';
import { api } from "~/trpc/react";
import StoredMarkers from './StoredMarkers';
import { useIncrementListenCount } from '~/lib/hooks/useIncrementListenCount';
import { AutoplayCountdownModal } from './AutoplayCountdownModal';
import { PlaylistNavigation } from './PlaylistNavigation';
import { useRouter, useSearchParams } from 'next/navigation';

interface AudioPlayerWithMarkersProps {
  audioUrl: string;
  peaksUrl?: string;
  audioName: string;
  audioDescription?: string | null;
  audioReadOnlyToken: string;
  audioId: string;
}

export default function ListenOnlyAudioPlayer({ 
  audioUrl, 
  peaksUrl,
  audioName,
  audioDescription,
  audioReadOnlyToken,
  audioId 
}: AudioPlayerWithMarkersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('playlistId');
  const autoplayParam = searchParams.get('autoplay') === 'true';
  
  const [markers, setMarkers] = useState<AudioMarker[]>([]);
  const { data: storedMarkers = [] } = api.marker.getMarkers.useQuery({ audioId });
  const [currentTime, setCurrentTime] = useState(0);
  const [playFromFunction, setPlayFromFunction] = useState<((marker: AudioMarker) => void) | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{start: number, end: number} | null>(null);
  const [clearRegionFunction, setClearRegionFunction] = useState<(() => void) | null>(null);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [nextAudio, setNextAudio] = useState<{ id: string; name: string } | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const [playFunction, setPlayFunction] = useState<(() => void) | null>(null);
  const [shouldAutoplay, setShouldAutoplay] = useState(!!playlistId && autoplayParam);
  const [autoplayEnabled, setAutoplayEnabled] = useState(autoplayParam);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [updateBrowserMarker, setUpdateBrowserMarker] = useState<((markerId: string, updates: { timestamp: number; endTimestamp?: number | null }) => void) | null>(null);

  // Fetch playlist data if autoplay is enabled
  const { data: playlist } = api.playlist.getPublicPlaylistById.useQuery(
    { id: playlistId! },
    { enabled: !!playlistId }
  );

  // Find next audio in playlist
  useEffect(() => {
    if (!playlist || !hasFinished || !autoplayEnabled) return;

    const currentIndex = playlist.audios.findIndex(pa => pa.audio.id === audioId);
    if (currentIndex === -1 || currentIndex === playlist.audios.length - 1) {
      // No next audio (last in playlist or not found)
      return;
    }

    const nextPlaylistAudio = playlist.audios[currentIndex + 1];
    if (nextPlaylistAudio) {
      setNextAudio({
        id: nextPlaylistAudio.audio.id,
        name: nextPlaylistAudio.audio.name,
      });
      setShowCountdownModal(true);
    }
  }, [playlist, audioId, hasFinished, autoplayEnabled]);

  const markerUnion = useMemo(() => {
    return [...markers, ...storedMarkers];
  }, [markers, storedMarkers]);

  // Use audioId or fallback to readonlyToken for unique identification
  const uniqueAudioId = audioId || audioReadOnlyToken;

  // Mutation to increment listen count
  const incrementListenCount = api.audio.incrementListenCount.useMutation();

  // Increment listen count (only once per 2 hours per browser/tab)
  useIncrementListenCount({
    id: audioId,
    type: 'audio',
    incrementMutation: incrementListenCount,
  });

  const handleMarkersChange = useCallback((newMarkers: AudioMarker[]) => {
    setMarkers(newMarkers);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayFromFnReady = useCallback((seekTo: (marker: AudioMarker) => void) => {
    setPlayFromFunction(() => seekTo);
  }, []);

  const handleMarkerClick = useCallback((marker: AudioMarker) => {
    if (playFromFunction) {
      playFromFunction(marker);
    }
  }, [playFromFunction]);

  const handleSelectedRegionUpdate = useCallback((start: number | null, end: number | null) => {
    if (start !== null && end !== null) {
      setSelectedRegion({ start, end });
    }
  }, []);

  const handleClearRegionReady = useCallback((clearRegion: () => void) => {
    setClearRegionFunction(() => clearRegion);
  }, []);

  const handleClearRegion = useCallback(() => {
    if (clearRegionFunction) {
      clearRegionFunction();
    }
    setSelectedRegion(null);
  }, [clearRegionFunction]);

  const handleAudioFinish = useCallback(() => {
    if (playlistId) {
      setHasFinished(true);
    }
  }, [playlistId]);

  const handlePlayNext = useCallback(() => {
    if (nextAudio && playlistId) {
      const params = new URLSearchParams();
      params.set('playlistId', playlistId);
      if (autoplayEnabled) {
        params.set('autoplay', 'true');
      }
      router.push(`/audios/${nextAudio.id}/listen?${params.toString()}`);
    }
  }, [nextAudio, playlistId, autoplayEnabled, router]);

  const handleCancelAutoplay = useCallback(() => {
    setShowCountdownModal(false);
    setHasFinished(false);
    setNextAudio(null);
  }, []);

  const handlePlayReady = useCallback((play: () => void) => {
    setPlayFunction(() => play);
  }, []);

  const handleNavigate = useCallback((audioId: string) => {
    if (playlistId) {
      const params = new URLSearchParams();
      params.set('playlistId', playlistId);
      if (autoplayEnabled) {
        params.set('autoplay', 'true');
      }
      router.push(`/audios/${audioId}/listen?${params.toString()}`);
    }
  }, [playlistId, autoplayEnabled, router]);

  // Handle marker updates from dragging/resizing in wavesurfer - save immediately
  const handleMarkerUpdated = useCallback((markerId: string, updates: { timestamp: number; endTimestamp?: number | null }) => {
    // Update browser markers via the exposed updateMarker function
    if (updateBrowserMarker) {
      updateBrowserMarker(markerId, updates);
    }
  }, [updateBrowserMarker]);

  const handleUpdateMarkerReady = useCallback((updateFn: (markerId: string, updates: { timestamp: number; endTimestamp?: number | null }) => void) => {
    setUpdateBrowserMarker(() => updateFn);
  }, []);

  // Toggle edit mode for a marker - just toggles state, saving happens immediately on drag
  const handleToggleEdit = useCallback((markerId: string) => {
    if (editingMarkerId === markerId) {
      setEditingMarkerId(null);
    } else {
      setEditingMarkerId(markerId);
    }
  }, [editingMarkerId]);

  // Trigger autoplay when player is ready
  useEffect(() => {
    if (shouldAutoplay && playFunction) {
      playFunction();
      setShouldAutoplay(false);
    }
  }, [shouldAutoplay, playFunction]);


  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Playlist Navigation */}
      {playlist && playlistId && (
        <div className="w-full max-w-3xl">
          <PlaylistNavigation
            playlist={playlist}
            currentAudioId={audioId}
            onNavigate={handleNavigate}
            autoplayEnabled={autoplayEnabled}
            onAutoplayToggle={setAutoplayEnabled}
          />
        </div>
      )}
    
      {/* Autoplay Countdown Modal */}
      {nextAudio && (
        <AutoplayCountdownModal
          isOpen={showCountdownModal}
          nextAudioName={nextAudio.name}
          onCancel={handleCancelAutoplay}
          onPlayNext={handlePlayNext}
          countdownSeconds={5}
        />
      )}
      
      {/* Audio Player */}
      <AudioPlayer
        audioUrl={audioUrl}
        peaksUrl={peaksUrl}
        audioName={audioName}
        audioDescription={audioDescription}
        audioReadOnlyToken={audioReadOnlyToken}
        markers={markerUnion}
        onTimeUpdate={handleTimeUpdate}
        onPlayFromFnReady={handlePlayFromFnReady}
        onSelectedRegionUpdate={handleSelectedRegionUpdate}
        onClearRegionReady={handleClearRegionReady}
        onFinish={handleAudioFinish}
        onPlayReady={handlePlayReady}
        editingMarkerId={editingMarkerId}
        onMarkerUpdated={handleMarkerUpdated}
      />

      <div className='flex flex-col items-center space-y-6'>
        
        {/* Stored Markers */}
        <StoredMarkers
          markers={storedMarkers}
          onMarkerClick={handleMarkerClick}
        />

        {/* Marker Manager */}
        <BrowserMarkerManager
          audioId={uniqueAudioId}
          currentTime={currentTime}
          onMarkersChange={handleMarkersChange}
          onMarkerClick={handleMarkerClick}
          selectedRegion={selectedRegion}
          onClearRegion={handleClearRegion}
          editingMarkerId={editingMarkerId}
          onToggleEdit={handleToggleEdit}
          onUpdateMarkerReady={handleUpdateMarkerReady}
        />
      </div>
    </div>
  );
}