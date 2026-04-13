import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Bookmark } from "lucide-react";
import type { AudioMarker } from "~/types/Audio";
import MarkerList from "../marker/MarkerList";
import { useTranslations } from "next-intl";

interface StoredMarksProps {
  markers: AudioMarker[];
  onMarkerClick?: (marker: AudioMarker) => void;
}

export default function StoredMarkers({
  markers,
  onMarkerClick,
}: StoredMarksProps) {
  const t = useTranslations("StoredMarkers");
  if (!markers) return null;
  return (
    <Card className="w-full">
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
        {/* Markers List */}
        {markers.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="text-sm font-medium text-default-600">
              {t("listTitle")}
            </h4>
            <MarkerList markers={markers} onMarkerClick={onMarkerClick} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
