import { getTranslations } from "next-intl/server";

interface VisibilityBannerProps {
  isPublic: boolean;
  isCreator: boolean;
}

export async function VisibilityBanner({
  isPublic,
  isCreator,
}: VisibilityBannerProps) {
  if (isPublic && !isCreator) return null;

  const backgroundColor = isPublic ? "bg-primary-100" : "bg-warning-100";
  const textColor = isPublic ? "text-primary-800" : "text-warning-800";
  const borderColor = isPublic ? "border-primary-200" : "border-warning-200";
  const t = await getTranslations("VisibilityBanner");

  return (
    <div
      className={`inline-block p-4 ${backgroundColor} ${textColor} border ${borderColor} rounded-lg mb-4`}
    >
      {isPublic ? (
        <p className="text-sm font-medium">{t("public")}</p>
      ) : (
        <p className="text-sm font-medium">{t("private")}</p>
      )}
    </div>
  );
}
