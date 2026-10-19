"use client";

import { api } from "~/trpc/react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { useTranslations } from "next-intl";

export default function LegalPage() {
  const t = useTranslations("LegalPage");
  const {
    data: legalInfos,
    isLoading,
    error,
  } = api.admin.legalInformation.getAllEnabledLegalInfo.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-default-200 rounded w-1/3"></div>
          <div className="h-4 bg-default-200 rounded w-full"></div>
          <div className="h-4 bg-default-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if ((error ?? !legalInfos) || legalInfos.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardBody className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
            <p className="text-default-500">{t("empty")}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // If only one legal page, show it directly without tabs
  if (legalInfos.length === 1) {
    const info = legalInfos[0];
    if (!info) return null;

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1>{info.label}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("lastUpdated", {
              date: new Date(info.updatedAt).toLocaleDateString(),
            })}
          </p>
          <div dangerouslySetInnerHTML={{ __html: info.content }} />
        </div>
      </div>
    );
  }

  // Multiple pages: show with tabs
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
      <Tabs aria-label={t("tabsAriaLabel")} variant="underlined">
        {legalInfos.map((info) => (
          <Tab key={info.id} title={info.label}>
            <div className="py-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t("lastUpdated", {
                    date: new Date(info.updatedAt).toLocaleDateString(),
                  })}
                </p>
                <div dangerouslySetInnerHTML={{ __html: info.content }} />
              </div>
            </div>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
