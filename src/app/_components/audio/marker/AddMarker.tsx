import { Button, Input, Switch } from "@heroui/react";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { formatTime, roundTime } from "~/lib/time";
import { useTranslations } from "next-intl";

interface AddMarkerProps {
  currentTime: number;
  onAddMarker: (
    label: string,
    startTime: number,
    endTime?: number | null,
  ) => void;
  selectedRegion?: { start: number | null; end: number | null };
  onClearRegion?: (() => void) | null;
}

export default function AddMarker({
  currentTime,
  onAddMarker,
  selectedRegion,
  onClearRegion,
}: AddMarkerProps) {
  const [newMarkerLabel, setNewMarkerLabel] = useState("");
  const [isSection, setIsSection] = useState(false);
  const roundedStartTime =
    selectedRegion?.start != null
      ? roundTime(selectedRegion.start)
      : roundTime(currentTime);
  const [sectionEndTime, setSectionEndTime] = useState<number>(
    roundedStartTime + 10,
  );
  const t = useTranslations("AddMarker");

  // Auto-enable section switch when a region is selected
  useEffect(() => {
    if (
      selectedRegion?.start != null &&
      selectedRegion?.end != null &&
      selectedRegion.end > selectedRegion.start
    ) {
      setIsSection(true);
    }
  }, [selectedRegion]);

  // Update section times when region is selected
  const effectiveStartTime =
    selectedRegion?.start != null
      ? roundTime(selectedRegion.start)
      : roundedStartTime;
  const effectiveEndTime =
    selectedRegion?.end != null && selectedRegion.end > effectiveStartTime
      ? roundTime(selectedRegion.end)
      : sectionEndTime;

  const handleAdd = () => {
    onAddMarker(
      newMarkerLabel,
      effectiveStartTime,
      isSection ? effectiveEndTime : null,
    );
    setNewMarkerLabel("");
  };

  const hasValidRegion =
    selectedRegion?.start &&
    selectedRegion?.end &&
    selectedRegion.end > selectedRegion.start;

  return (
    <div className="flex flex-col gap-2 w-full">
      <Switch
        size="sm"
        isSelected={isSection}
        isDisabled={!hasValidRegion}
        onValueChange={(checked) => {
          setIsSection(checked);
          if (checked && sectionEndTime <= effectiveStartTime) {
            setSectionEndTime(effectiveStartTime + 10);
          }
          // Clear region selection when switch is disabled
          if (!checked && onClearRegion) {
            onClearRegion();
          }
        }}
      >
        <span className="text-sm">
          {t("createSection", { defaultMessage: "Create section" })}
        </span>
      </Switch>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          size="sm"
          placeholder={t("labelPlaceholder")}
          value={newMarkerLabel}
          onValueChange={setNewMarkerLabel}
          className="grow"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleAdd();
            }
          }}
        />

        {/* Quick Add Marker at Current Time */}
        <Button
          size="sm"
          color="success"
          variant="flat"
          onPress={handleAdd}
          startContent={<Plus size={16} />}
          className="shrink-0"
        >
          {isSection
            ? t("addSection", {
                start: formatTime(effectiveStartTime),
                end: formatTime(effectiveEndTime),
              })
            : t("addAt", { time: formatTime(effectiveStartTime) })}
        </Button>
      </div>
    </div>
  );
}
