"use client";

import { Card, CardBody, Button, Chip, Switch } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  List,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PlaylistWithAudios } from "~/types/Playlist";

interface PlaylistNavigationProps {
  playlist: PlaylistWithAudios;
  currentAudioId: string;
  onNavigate: (audioId: string) => void;
  autoplayEnabled: boolean;
  onAutoplayToggle: (enabled: boolean) => void;
}

export function PlaylistNavigation({
  playlist,
  currentAudioId,
  onNavigate,
  autoplayEnabled,
  onAutoplayToggle,
}: PlaylistNavigationProps) {
  const t = useTranslations("PlaylistNavigation");
  const [isExpanded, setIsExpanded] = useState(false);

  const currentIndex = playlist.audios.findIndex(
    (pa) => pa.audio.id === currentAudioId,
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < playlist.audios.length - 1;

  // Show 2 previous and 2 next audios
  const visibleStart = Math.max(0, currentIndex - 2);
  const visibleEnd = Math.min(playlist.audios.length, currentIndex + 3);
  const visibleAudios = playlist.audios.slice(visibleStart, visibleEnd);

  const handlePrev = () => {
    if (hasPrev) {
      const prevAudio = playlist.audios[currentIndex - 1];
      if (prevAudio) {
        onNavigate(prevAudio.audio.id);
      }
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextAudio = playlist.audios[currentIndex + 1];
      if (nextAudio) {
        onNavigate(nextAudio.audio.id);
      }
    }
  };

  return (
    <Card className="shadow-sm w-full">
      <CardBody className="gap-3">
        {/* Header with playlist name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Button>
            <List size={18} className="text-primary flex-shrink-0" />
            <h3 className="text-md font-semibold truncate">{playlist.name}</h3>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color="secondary"
            className="self-start sm:self-center"
          >
            {t("position", {
              current: currentIndex + 1,
              total: playlist.audios.length,
            })}
          </Chip>
        </div>

        {/* Collapsible content */}
        {isExpanded && (
          <>
            {/* Audio list */}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {visibleAudios.map((playlistAudio, idx) => {
                const isCurrent = playlistAudio.audio.id === currentAudioId;
                const actualIndex = visibleStart + idx;

                return (
                  <div
                    key={playlistAudio.audio.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                        : "hover:bg-default-100 cursor-pointer"
                    }`}
                    onClick={() =>
                      !isCurrent && onNavigate(playlistAudio.audio.id)
                    }
                  >
                    <span className="text-xs text-default-500 min-w-[2rem] text-right">
                      {actualIndex + 1}.
                    </span>
                    <span
                      className={`text-sm flex-1 truncate ${isCurrent ? "font-semibold text-primary" : ""}`}
                    >
                      {playlistAudio.audio.name}
                    </span>
                    {isCurrent && (
                      <Chip size="sm" color="primary" variant="flat">
                        {t("playing")}
                      </Chip>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons and autoplay */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-default-200">
              <Button
                size="sm"
                variant="flat"
                startContent={<ChevronLeft size={16} />}
                onPress={handlePrev}
                isDisabled={!hasPrev}
              >
                {t("previous")}
              </Button>

              <Switch
                size="sm"
                isSelected={autoplayEnabled}
                onValueChange={onAutoplayToggle}
              >
                <span className="text-sm">{t("autoplay")}</span>
              </Switch>

              <Button
                size="sm"
                variant="flat"
                endContent={<ChevronRight size={16} />}
                onPress={handleNext}
                isDisabled={!hasNext}
              >
                {t("next")}
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
