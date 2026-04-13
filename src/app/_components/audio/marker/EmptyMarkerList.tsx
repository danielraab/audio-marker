import { useTranslations } from "next-intl";

export default function EmptyMarkerList() {
  const t = useTranslations("EmptyMarkerList");
  return (
    <div className="text-center py-4">
      <p className="text-sm text-default-500">{t("description")}</p>
    </div>
  );
}
