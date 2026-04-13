"use client";

import { Card, CardHeader, Chip, CardBody } from "@heroui/react";
import { api } from "~/trpc/react";
import type { AudioMarker } from "~/types/Audio";
import { Bookmark } from "lucide-react";
import AddMarker from "../marker/AddMarker";
import MarkerList from "../marker/MarkerList";
import EmptyMarkerList from "../marker/EmptyMarkerList";
import { useTranslations } from "next-intl";

interface MarkerManagerProps {
  audioId: string;
  currentTime: number;
  markers: AudioMarker[];
  onMarkerClick?: (marker: AudioMarker) => void;
  selectedRegion?: { start: number | null; end: number | null };
  onClearRegion?: (() => void) | null;
  editingMarkerId?: string | null;
  onToggleEdit?: (markerId: string) => void;
}

export function StoredMarkerManager({
  audioId,
  currentTime,
  markers,
  onMarkerClick,
  selectedRegion,
  onClearRegion,
  editingMarkerId,
  onToggleEdit,
}: MarkerManagerProps) {
  const utils = api.useUtils();
  const t = useTranslations("StoredMarkers");

  const createMarker = api.marker.createMarker.useMutation({
    onSuccess: () => {
      void utils.marker.getMarkers.invalidate({ audioId });
    },
  });

  const addMarkerAtCurrentTime = (
    label: string,
    startTime: number,
    endTime?: number | null,
  ) => {
    createMarker.mutate({
      audioId,
      timestamp: startTime,
      endTimestamp: endTime,
      label: label.trim() || t("defaultLabel", { index: markers.length + 1 }),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    });
  };

  const deleteMarker = api.marker.deleteMarker.useMutation({
    onSuccess: () => {
      void utils.marker.getMarkers.invalidate({ audioId });
    },
  });

  const onDeleteMarker = (markerId: string) => {
    deleteMarker.mutate({ id: markerId });
  };

  return (
    <Card className="max-w-xl">
      <CardHeader className="flex flex-col items-start">
        <div className="flex flex-row items-center gap-2 pb-2">
          <Bookmark size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <Chip size="sm" variant="flat" color="primary">
            {markers.length}
          </Chip>
        </div>
        <p className="text-small text-default-500">{t("subtitle")}</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Add Stored Marker */}
        <div className="flex gap-2">
          <AddMarker
            currentTime={currentTime}
            onAddMarker={addMarkerAtCurrentTime}
            selectedRegion={selectedRegion}
            onClearRegion={onClearRegion}
          />
        </div>

        {/* Markers List */}
        {markers.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="text-sm font-medium text-default-600">
              {t("listTitle")}
            </h4>
            <MarkerList
              markers={markers}
              onMarkerClick={onMarkerClick}
              onRemoveMarker={onDeleteMarker}
              onToggleEdit={onToggleEdit}
              editingMarkerId={editingMarkerId}
            />
          </div>
        )}

        {markers.length === 0 && <EmptyMarkerList />}
      </CardBody>
    </Card>
  );
}
