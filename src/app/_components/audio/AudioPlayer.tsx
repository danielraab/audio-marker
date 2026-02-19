'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Button, Chip, Slider } from '@heroui/react';
import { Play, Pause, Square, ZoomIn, Gauge, SquareArrowOutUpRight } from 'lucide-react';
import LoadingOverlay from '../global/LoadingOverlay';
import VolumeControl from './VolumeControl';
import Link from 'next/link';
import type { AudioMarker } from '~/types/Audio';
import { formatTime } from '~/lib/time';
import { isSection } from '~/lib/marker';
import { useTranslations } from 'next-intl';
import { useWakeLock } from './hooks/useWakeLock';

const markerIdPrefix = 'app-marker-';
const initialZoomLevel = 20;
/** Minimum ms between React state updates during playback */
const TIME_UPDATE_THROTTLE_MS = 250;

interface AudioPlayerProps {
  audioUrl: string;
  audioName: string;
  audioDescription?: string | null;
  audioReadOnlyToken: string;
  peaksUrl?: string;
  markers?: AudioMarker[];
  onTimeUpdate?: (time: number) => void;
  onPlayFromFnReady?: (playFrom: (marker: AudioMarker) => void) => void;
  onSelectedRegionUpdate?: (start: number | null, end: number | null) => void;
  onClearRegionReady?: (clearRegion: () => void) => void;
  onFinish?: () => void;
  onPlayReady?: (play: () => void) => void;
  editingMarkerId?: string | null;
  onMarkerUpdated?: (markerId: string, updates: { timestamp: number; endTimestamp?: number | null }) => void;
}

export default function AudioPlayer({
  audioUrl,
  audioName,
  audioDescription,
  audioReadOnlyToken,
  peaksUrl,
  markers = [],
  onTimeUpdate,
  onPlayFromFnReady,
  onSelectedRegionUpdate,
  onClearRegionReady,
  onFinish,
  onPlayReady,
  editingMarkerId,
  onMarkerUpdated,
}: AudioPlayerProps) {
  const t = useTranslations('AudioPlayer');

  // WaveSurfer refs
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const regionsPlugin = useRef<RegionsPlugin | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  // Control state
  const [zoomLevel, setZoomLevel] = useState(initialZoomLevel);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(100);

  // Internal refs — keep callback props and markers in refs so the main
  // WaveSurfer useEffect only depends on audioUrl (prevents re-init).
  const selectionRegionId = useRef<string | null>(null);
  const activeRegionId = useRef<string | null>(null);
  const markersRef = useRef(markers);
  const callbacksRef = useRef({ onTimeUpdate, onSelectedRegionUpdate, onFinish, onMarkerUpdated });
  const lastTimeUpdateRef = useRef(0);

  markersRef.current = markers;
  callbacksRef.current = { onTimeUpdate, onSelectedRegionUpdate, onFinish, onMarkerUpdated };

  // Keep screen awake during playback
  useWakeLock(isPlaying);

  // Track when component has mounted (after hydration completes)
  useEffect(() => { setMounted(true); }, []);

  // Fetch peaks data from provided URL
  useEffect(() => {
    if (!peaksUrl || !mounted) return;

    const fetchPeaks = async () => {
      try {
        const response = await fetch(peaksUrl);
        if (response.ok) {
          const data = await response.json() as { peaks: number[] };
          setPeaks(data.peaks);
        }
      } catch (error) {
        console.warn('Failed to fetch peaks, will generate on-the-fly:', error);
      }
    };

    void fetchPeaks();
  }, [peaksUrl, mounted]);

  // ── Region helpers ──────────────────────────────────────────────────

  const syncRegionsToMarkers = useCallback((list: AudioMarker[], editingId: string | null | undefined) => {
    if (!regionsPlugin.current || !wavesurfer.current) return;

    const existing = regionsPlugin.current.getRegions();
    const markerRegions = existing.filter(r => r.id.startsWith(markerIdPrefix));
    const wanted = new Set(list.map(m => markerIdPrefix + m.id));

    // Remove stale
    markerRegions.forEach(r => { if (!wanted.has(r.id)) r.remove(); });

    // Add / update
    list.forEach((marker) => {
      const id = markerIdPrefix + marker.id;
      const section = isSection(marker);
      const editing = editingId === marker.id;
      const color = section && marker.color
        ? marker.color.replace('hsl(', 'hsla(').replace(')', ', 0.15)')
        : marker.color;

      const opts = {
        start: marker.timestamp,
        end: section ? marker.endTimestamp! : undefined,
        color,
        content: marker.label,
        drag: editing,
        resize: editing && section,
      };

      const found = existing.find(r => r.id === id);
      if (found) {
        found.setOptions(opts);
      } else {
        regionsPlugin.current?.addRegion({ id, ...opts });
      }
    });
  }, []);

  // ── WaveSurfer initialisation ───────────────────────────────────────

  useEffect(() => {
    if (!waveformRef.current || !mounted) return;

    setIsLoading(true);

    const regions = RegionsPlugin.create();
    regionsPlugin.current = regions;

    // Region event handlers (use refs so they always see latest callbacks)
    const onRegionDblClick = (region: Region, e: MouseEvent) => {
      e.stopPropagation();
      activeRegionId.current = region.id;
      region.play();
    };

    const onRegionOut = (region: Region) => {
      if (activeRegionId.current === region.id && region.end !== region.start && wavesurfer.current?.isPlaying()) {
        region.play();
      }
    };

    const onRegionUpdated = (region: Region) => {
      if (region.id === selectionRegionId.current) {
        callbacksRef.current.onSelectedRegionUpdate?.(region.start, region.end);
      }
      if (region.id.startsWith(markerIdPrefix)) {
        const markerId = region.id.replace(markerIdPrefix, '');
        const marker = markersRef.current.find(m => m.id === markerId);
        if (marker) {
          const updates: { timestamp: number; endTimestamp?: number | null } = { timestamp: region.start };
          if (isSection(marker)) updates.endTimestamp = region.end;
          callbacksRef.current.onMarkerUpdated?.(markerId, updates);
        }
      }
    };

    const onRegionCreated = (region: Region) => {
      if (region.id.startsWith(markerIdPrefix)) return;
      // Replace previous selection
      if (selectionRegionId.current) {
        const prev = regions.getRegions().find(r => r.id === selectionRegionId.current);
        if (prev && prev.id !== region.id) prev.remove();
      }
      selectionRegionId.current = region.id;
      callbacksRef.current.onSelectedRegionUpdate?.(region.start, region.end);
    };

    regions.on('region-double-clicked', onRegionDblClick);
    regions.on('region-out', onRegionOut);
    regions.on('region-updated', onRegionUpdated);
    regions.on('region-created', onRegionCreated);

    // Create WaveSurfer with pre-computed peaks for fast rendering.
    // Peaks are fetched from the server (generated during upload), providing
    // instant waveform visualization. MediaElement backend ensures accurate playback.
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      url: audioUrl,
      peaks: peaks ? [peaks] : undefined,
      waveColor: '#0070f0',
      progressColor: '#0052cc',
      cursorColor: '#0070f0',
      barWidth: 2,
      barRadius: 3,
      height: 150,
      normalize: true,
      backend: 'MediaElement',
      plugins: [Timeline.create(), regions],
    });

    wavesurfer.current = ws;

    regions.enableDragSelection({ color: 'rgba(0, 112, 240, 0.2)' });

    // WaveSurfer event handlers
    const onPlay = () => setIsPlaying(true);

    const onPause = () => {
      setIsPlaying(false);
      // Flush final time so the display matches the paused position
      const time = ws.getCurrentTime();
      setCurrentTime(time);
      callbacksRef.current.onTimeUpdate?.(time);
    };

    const onWsFinish = () => {
      setIsPlaying(false);
      setCurrentTime(ws.getDuration());
      callbacksRef.current.onFinish?.();
    };

    const onReady = () => {
      setIsLoading(false);
      setLoadError(null);
      setDuration(ws.getDuration());
      ws.zoom(initialZoomLevel);
    };

    const onError = (error: Error) => {
      setIsLoading(false);
      setLoadError(error.message);
      console.error('Audio loading error:', error);
    };

    const onTimeUpdate = () => {
      const now = performance.now();
      if (now - lastTimeUpdateRef.current < TIME_UPDATE_THROTTLE_MS) return;
      lastTimeUpdateRef.current = now;
      const time = ws.getCurrentTime();
      setCurrentTime(time);
      callbacksRef.current.onTimeUpdate?.(time);
    };

    const onInteraction = () => {
      const time = ws.getCurrentTime();
      setCurrentTime(time);
      activeRegionId.current = null;
      callbacksRef.current.onTimeUpdate?.(time);
    };

    ws.on('play', onPlay);
    ws.on('pause', onPause);
    ws.on('finish', onWsFinish);
    ws.on('ready', onReady);
    ws.on('error', onError);
    ws.on('timeupdate', onTimeUpdate);
    ws.on('interaction', onInteraction);

    return () => {
      regions.un('region-double-clicked', onRegionDblClick);
      regions.un('region-out', onRegionOut);
      regions.un('region-updated', onRegionUpdated);
      regions.un('region-created', onRegionCreated);
      if (ws.isPlaying()) ws.pause();
      ws.un('play', onPlay);
      ws.un('pause', onPause);
      ws.un('finish', onWsFinish);
      ws.un('ready', onReady);
      ws.un('error', onError);
      ws.un('timeupdate', onTimeUpdate);
      ws.un('interaction', onInteraction);
      ws.destroy();
      wavesurfer.current = null;
    };
  }, [audioUrl, mounted, peaks]); // Re-init when audio URL, mount state, or peaks change

  // ── Sync marker regions (no WaveSurfer re-init) ─────────────────────

  useEffect(() => {
    if (!isLoading && wavesurfer.current && regionsPlugin.current) {
      syncRegionsToMarkers(markers, editingMarkerId);
    }
  }, [markers, isLoading, syncRegionsToMarkers, editingMarkerId]);

  // Seek to marker being edited
  useEffect(() => {
    if (!isLoading && wavesurfer.current && editingMarkerId) {
      const marker = markers.find(m => m.id === editingMarkerId);
      if (marker) {
        if (wavesurfer.current.isPlaying()) wavesurfer.current.pause();
        const dur = wavesurfer.current.getDuration();
        if (dur > 0) wavesurfer.current.seekTo(marker.timestamp / dur);
      }
    }
  }, [editingMarkerId, isLoading, markers]);

  // ── Expose imperative handles to parent ─────────────────────────────

  const playFrom = useCallback((marker: AudioMarker) => {
    if (!wavesurfer.current) return;
    const region = regionsPlugin.current?.getRegions().find(r => r.id === markerIdPrefix + marker.id);
    if (region) {
      activeRegionId.current = region.id;
      region.play();
    } else {
      wavesurfer.current.seekTo(marker.timestamp / wavesurfer.current.getDuration());
    }
  }, []);

  const clearSelectionRegion = useCallback(() => {
    if (regionsPlugin.current && selectionRegionId.current) {
      regionsPlugin.current.getRegions().find(r => r.id === selectionRegionId.current)?.remove();
      selectionRegionId.current = null;
      callbacksRef.current.onSelectedRegionUpdate?.(null, null);
    }
  }, []);

  useEffect(() => { if (!isLoading && onPlayFromFnReady) onPlayFromFnReady(playFrom); }, [isLoading, playFrom, onPlayFromFnReady]);

  useEffect(() => {
    if (!isLoading && onPlayReady) {
      onPlayReady(() => { if (wavesurfer.current && !wavesurfer.current.isPlaying()) void wavesurfer.current.play(); });
    }
  }, [isLoading, onPlayReady]);

  useEffect(() => { if (!isLoading && onClearRegionReady) onClearRegionReady(clearSelectionRegion); }, [isLoading, clearSelectionRegion, onClearRegionReady]);

  // ── Keyboard shortcut (spacebar) ────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' && !isLoading && wavesurfer.current &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as Element)?.getAttribute('contenteditable')
      ) {
        e.preventDefault();
        if (wavesurfer.current.isPlaying()) {
          wavesurfer.current.pause();
        } else {
          void wavesurfer.current.play();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLoading]);

  // ── Control handlers ────────────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    if (!wavesurfer.current) return;
    if (wavesurfer.current.isPlaying()) {
      wavesurfer.current.pause();
    } else {
      void wavesurfer.current.play();
    }
  }, []);

  const handleStop = useCallback(() => {
    if (!wavesurfer.current) return;
    wavesurfer.current.stop();
    activeRegionId.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleZoomChange = useCallback((value: number | number[]) => {
    const zoom = Array.isArray(value) ? value[0] : value;
    if (typeof zoom === 'number') {
      setZoomLevel(zoom);
      wavesurfer.current?.zoom(zoom);
    }
  }, []);

  const handlePlaybackRateChange = useCallback((value: number | number[]) => {
    const rate = Array.isArray(value) ? value[0] : value;
    if (typeof rate !== 'number') return;

    setPlaybackRate(rate);
    const ws = wavesurfer.current;
    if (!ws) return;

    const wasPlaying = ws.isPlaying();
    const time = ws.getCurrentTime();
    const dur = ws.getDuration();
    if (wasPlaying) ws.pause();
    ws.setPlaybackRate(rate);
    if (dur > 0) ws.seekTo(time / dur);
    if (wasPlaying) void ws.play();
  }, []);

  const handleSpeedReset = useCallback(() => {
    setPlaybackRate(1);
    wavesurfer.current?.setPlaybackRate(1);
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol);
    wavesurfer.current?.setVolume(vol / 100);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex flex-col mb-3 w-full">
        <div className="flex items-center justify-between gap-2 text-lg font-semibold">
          {audioName}
          <Link href={`/audios/${audioReadOnlyToken}/listen`} title={t('publicLinkTitle')}>
            <SquareArrowOutUpRight size={16} />
          </Link>
        </div>
        {audioDescription && (
          <p className="text-sm text-default-600 mt-1 mb-2">{audioDescription}</p>
        )}
        <div className="flex flex-row justify-between items-center">
          <p className="text-small text-default-500">{t('subtitle')}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-default-500">{t('status.label')}</span>
            <Chip size="sm" color={isPlaying ? 'success' : 'default'} variant="flat">
              {!mounted ? t('status.paused') : isLoading ? t('status.loading') : isPlaying ? t('status.playing') : t('status.paused')}
            </Chip>
          </div>
        </div>
      </div>

      {/* Waveform — CSS containment isolates it from layout thrashing */}
      <div
        ref={waveformRef}
        className="w-full border border-default-200 rounded-lg p-2"
        style={{ minHeight: '100px', contain: 'layout style' }}
      />

      {/* Error */}
      {loadError && (
        <div className="my-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-danger-600 font-semibold">{t('error.title')}</p>
          <p className="text-danger-500 text-sm mt-1">{t('error.message')}</p>
          <p className="text-danger-400 text-xs mt-2">{loadError}</p>
        </div>
      )}

      {/* Loading */}
      {mounted && isLoading && <LoadingOverlay label={t('loadingLabel')} />}

      {/* Zoom & Speed Controls */}
      <div className="flex flex-col sm:flex-row gap-4 my-4">
        <div className="flex items-center gap-3 flex-1">
          <ZoomIn size={16} className="text-default-500" />
          <span className="text-sm text-default-500 min-w-12">{t('zoom.label')}</span>
          <Slider
            size="sm" step={2} minValue={0} maxValue={100}
            value={zoomLevel} onChange={handleZoomChange}
            className="flex-1" color="primary" isDisabled={isLoading}
            aria-label={t('zoom.ariaLabel')}
          />
          <span className="text-xs text-default-500 min-w-8">{zoomLevel}</span>
        </div>

        <div className="flex items-center gap-3 flex-1">
          <div onDoubleClick={handleSpeedReset} className="cursor-pointer select-none flex items-center gap-1" title={t('speed.resetTitle')}>
            <Gauge size={16} className="text-default-500" />
            <span className="text-sm text-default-500 min-w-12">{t('speed.label')}</span>
          </div>
          <Slider
            size="sm" step={0.05} minValue={0.25} maxValue={2}
            value={playbackRate} onChange={handlePlaybackRateChange}
            className="flex-1" color="primary" isDisabled={isLoading}
            aria-label={t('speed.ariaLabel')}
          />
          <span className="text-xs text-default-500 min-w-8">{playbackRate.toFixed(2)}x</span>
        </div>
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-sm text-default-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button
          isIconOnly size="lg" color="primary" variant="flat"
          onPress={handlePlayPause} isDisabled={isLoading}
          aria-label={isPlaying ? t('controls.pause') : t('controls.play')}
          startContent={isPlaying ? <Pause size={24} /> : <Play size={24} />}
        />

        <Button
          isIconOnly size="lg" color="danger" variant="flat"
          onPress={handleStop} isDisabled={isLoading}
          aria-label={t('controls.stop')}
          startContent={<Square size={24} />}
        />

        <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} isDisabled={isLoading} />
      </div>
    </div>
  );
}
