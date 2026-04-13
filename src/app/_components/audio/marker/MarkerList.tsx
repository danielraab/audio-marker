import { Button } from "@heroui/button";
import { Trash2, Brackets, Pencil, Check } from "lucide-react";
import { formatTime } from "~/lib/time";
import { isSection } from "~/lib/marker";
import type { AudioMarker } from "~/types/Audio";
import { useTranslations } from "next-intl";

interface MarkerListProps {
  markers: AudioMarker[];
  onMarkerClick?: (marker: AudioMarker) => void;
  onRemoveMarker?: (markerId: string) => void;
  onToggleEdit?: (markerId: string) => void;
  editingMarkerId?: string | null;
}

export default function MarkerList({
  markers,
  onMarkerClick,
  onRemoveMarker,
  onToggleEdit,
  editingMarkerId,
}: MarkerListProps) {
  const t = useTranslations("MarkerList");

  return (
    <>
      {markers.map((marker) => {
        const markerIsSection = isSection(marker);
        return (
          <div
            key={marker.id}
            className="flex items-center justify-between p-2 py-1 bg-default-100 rounded-lg"
          >
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-default-200 -m-2 p-2 py-1 rounded-lg transition-colors"
              onClick={() => onMarkerClick?.(marker)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onMarkerClick?.(marker);
                }
              }}
            >
              {markerIsSection ? (
                <div
                  className="w-3 h-3 rounded flex-shrink-0"
                  style={{ backgroundColor: marker.color }}
                  title={t("sectionTitle")}
                >
                  <Brackets size={12} className="text-white" />
                </div>
              ) : (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: marker.color }}
                  title={t("pointMarkerTitle")}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{marker.label}</p>
                <p className="text-xs text-default-500">
                  {markerIsSection
                    ? `${formatTime(marker.timestamp)} - ${formatTime(marker.endTimestamp!)}`
                    : formatTime(marker.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onToggleEdit && (
                <Button
                  size="sm"
                  color={editingMarkerId === marker.id ? "success" : "primary"}
                  variant="light"
                  isIconOnly
                  onPress={() => onToggleEdit(marker.id)}
                  startContent={
                    editingMarkerId === marker.id ? (
                      <Check size={14} />
                    ) : (
                      <Pencil size={14} />
                    )
                  }
                  title={
                    editingMarkerId === marker.id
                      ? t("saveChanges")
                      : t("editMarker")
                  }
                />
              )}
              {onRemoveMarker && (
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  isIconOnly
                  onPress={() => onRemoveMarker(marker.id)}
                  startContent={<Trash2 size={14} />}
                  title={t("deleteMarker")}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
