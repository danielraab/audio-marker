"use client";

import { Card, CardBody } from "@heroui/card";
import { Users, Music, ListMusic, Headphones } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RouterOutputs } from "~/trpc/react";

type OverallStats =
  RouterOutputs["admin"]["statistics"]["getOverallStatistics"];

interface OverviewStatsCardsProps {
  stats: OverallStats;
}

export default function OverviewStatsCards({ stats }: OverviewStatsCardsProps) {
  const t = useTranslations("AdminStatistics");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardBody className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Users className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-default-500">{t("stats.users")}</p>
            <p className="text-2xl font-bold">{stats.users.total}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-success/10 p-3">
            <Music className="text-success" size={24} />
          </div>
          <div>
            <p className="text-sm text-default-500">{t("stats.audios")}</p>
            <p className="text-2xl font-bold">{stats.audios.active}</p>
            <p className="text-xs text-default-400">
              {t("stats.publicCount", { count: stats.audios.public })}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-secondary/10 p-3">
            <ListMusic className="text-secondary" size={24} />
          </div>
          <div>
            <p className="text-sm text-default-500">{t("stats.playlists")}</p>
            <p className="text-2xl font-bold">{stats.playlists.active}</p>
            <p className="text-xs text-default-400">
              {t("stats.publicCount", { count: stats.playlists.public })}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-warning/10 p-3">
            <Headphones className="text-warning" size={24} />
          </div>
          <div>
            <p className="text-sm text-default-500">
              {t("stats.totalListens")}
            </p>
            <p className="text-2xl font-bold">
              {stats.listens.totalAudioListens}
            </p>
            <p className="text-xs text-default-400">
              {t("stats.recentListens", {
                count: stats.listens.recentAudioListens,
              })}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
