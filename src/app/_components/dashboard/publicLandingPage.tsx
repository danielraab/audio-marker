import {
  Bookmark,
  FileMusic,
  FlagTriangleRight,
  Section,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function PublicLandingPage() {
  const t = await getTranslations("PublicLanding");

  return (
    <>
      <h1 className="flex items-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
        <Image
          height={64}
          width={64}
          src="/audio-marker-logo.svg"
          alt={t("logoAlt")}
          className="h-16 w-16 object-contain transition-transform hover:scale-105"
        />
        <span>{t("title")}</span>
      </h1>
      <div className="max-w-3xl flex flex-col gap-4 sm:grid sm:grid-cols-2 md:gap-8">
        <div className="flex flex-col gap-4 rounded-xl p-4">
          <FileMusic />
          <h3 className="text-2xl font-bold">{t("upload.title")}</h3>
          <div className="text-lg">{t("upload.description")}</div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl p-4">
          <Bookmark />
          <h3 className="text-2xl font-bold">{t("marker.title")}</h3>
          <div className="text-lg">{t("marker.description")}</div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl p-4">
          <Share2 />
          <h3 className="text-2xl font-bold">{t("share.title")}</h3>
          <div className="text-lg">{t("share.description")}</div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl p-4">
          <FlagTriangleRight />
          <h3 className="text-2xl font-bold">{t("browser.title")}</h3>
          <div className="text-lg">{t("browser.description")}</div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl p-4 col-span-2">
          <Section />
          <h3 className="text-2xl font-bold">{t("caution.title")}</h3>
          <div className="text-lg">{t("caution.description")}</div>
        </div>
      </div>
    </>
  );
}
