'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Slider } from '@heroui/react';
import { Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  isDisabled?: boolean;
}

export default function VolumeControl({ volume, onVolumeChange, isDisabled }: VolumeControlProps) {
  const t = useTranslations('AudioPlayer');
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSlider, setShowSlider] = useState(false);

  // Click outside to close
  useEffect(() => {
    if (!showSlider) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSlider]);

  const handleChange = (value: number | number[]) => {
    const vol = Array.isArray(value) ? value[0] : value;
    if (typeof vol === 'number') {
      onVolumeChange(vol);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        isIconOnly
        size="lg"
        color="default"
        variant="flat"
        onPress={() => setShowSlider(!showSlider)}
        isDisabled={isDisabled}
        aria-label={t('volume.toggleLabel')}
        startContent={<Volume2 size={24} />}
      />

      {showSlider && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-default-100 border border-default-200 rounded-lg shadow-lg p-3 min-w-[200px]">
          <div className="flex items-center gap-3">
            <Slider
              size="sm"
              step={1}
              minValue={0}
              maxValue={100}
              value={volume}
              onChange={handleChange}
              className="flex-1"
              color="primary"
              isDisabled={isDisabled}
              aria-label={t('volume.ariaLabel')}
            />
            <span className="text-xs text-default-500 min-w-12">{volume}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
