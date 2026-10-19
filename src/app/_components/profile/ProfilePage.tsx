"use client";

import { Card, CardBody } from "@heroui/card";
import { useTranslations } from "next-intl";
import PasskeySection from "./PasskeySection";

interface ProfilePageProps {
  passkeysEnabled: boolean;
}

export default function ProfilePage({ passkeysEnabled }: ProfilePageProps) {
  const t = useTranslations("ProfilePage");
  const hasSections = passkeysEnabled;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-default-500">{t("description")}</p>
      </div>

      <div className="space-y-8">
        {passkeysEnabled && <PasskeySection />}
        {!hasSections && (
          <Card>
            <CardBody>
              <p className="text-default-500">{t("empty")}</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
