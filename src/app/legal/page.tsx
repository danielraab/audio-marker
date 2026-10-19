import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "~/app/_components/legal/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LegalPage.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Legal() {
  return <LegalPage />;
}
