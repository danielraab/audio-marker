"use client";

import { Tabs, Tab } from "@heroui/tabs";
import UserListSection from "./UserListSection";
import SystemSettingsSection from "./SystemSettingsSection";
import SoftDeletedSection from "./SoftDeletedSection";
import LegalInformationSection from "./LegalInformationSection";
import StatisticsSection from "./StatisticsSection";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("SettingsPage");
  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-default-500">{t("description")}</p>
      </div>

      <Tabs
        id="settings-tabs"
        aria-label={t("tabs.ariaLabel")}
        variant="underlined"
        classNames={{
          base: "w-full",
          tabList:
            "w-full max-w-full overflow-x-scroll scrollbar-hide flex-nowrap",
        }}
      >
        <Tab key="statistics" title={t("tabs.statistics")}>
          <div className="py-4">
            <StatisticsSection />
          </div>
        </Tab>
        <Tab key="users" title={t("tabs.users")}>
          <div className="py-4">
            <UserListSection />
          </div>
        </Tab>
        <Tab key="softDeleted" title={t("tabs.softDeleted")}>
          <div className="py-4">
            <SoftDeletedSection />
          </div>
        </Tab>
        <Tab key="legal" title="Legal Pages">
          <div className="py-4">
            <LegalInformationSection />
          </div>
        </Tab>
        <Tab key="system" title={t("tabs.system")}>
          <div className="py-4">
            <SystemSettingsSection />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
