"use client";

import { Card, CardBody, CardHeader, Select, SelectItem } from "@heroui/react";
import { api } from "~/trpc/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { Play, Edit, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { ListenChart } from "./ListenChart";

interface AudioStatisticsViewProps {
  audioId: string;
}

const periodOptions = [
  { value: 7, labelKey: "last7Days" },
  { value: 14, labelKey: "last14Days" },
  { value: 30, labelKey: "last30Days" },
  { value: 90, labelKey: "last90Days" },
  { value: 365, labelKey: "lastYear" },
];

export function AudioStatisticsView({ audioId }: AudioStatisticsViewProps) {
  const [days, setDays] = useState(30);
  const t = useTranslations("AudioStatistics");

  const [statistics] = api.audio.getListenStatistics.useSuspenseQuery({
    id: audioId,
    days,
  });

  // Calculate some derived stats
  const avgListensPerDay =
    statistics.periodListens > 0
      ? (statistics.periodListens / days).toFixed(1)
      : "0";

  const maxListensInDay = Math.max(
    ...statistics.dailyStats.map((d) => d.listens),
  );
  const peakDay = statistics.dailyStats.find(
    (d) => d.listens === maxListensInDay && maxListensInDay > 0,
  );

  return (
    <div className="w-full max-w-4xl px-4 flex flex-col gap-6">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {t("title", { name: statistics.audioName })}
          </h1>
          <p className="text-default-500 text-sm">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/audios/${audioId}/listen`}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors"
          >
            <Play size={16} />
            {t("actions.listen")}
          </Link>
          <Link
            href={`/audios/${audioId}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            <Edit size={16} />
            {t("actions.edit")}
          </Link>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-end">
        <Select
          label={t("periodSelector.label")}
          selectedKeys={[days.toString()]}
          onChange={(e) => setDays(Number(e.target.value))}
          className="max-w-xs"
          size="sm"
        >
          {periodOptions.map((option) => (
            <SelectItem key={option.value.toString()}>
              {t(`periodSelector.${option.labelKey}`)}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <BarChart3 className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">
                {t("stats.totalListens")}
              </p>
              <p className="text-2xl font-bold">{statistics.totalListens}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="text-success" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">
                {t("stats.periodListens", { days })}
              </p>
              <p className="text-2xl font-bold">{statistics.periodListens}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Calendar className="text-warning" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">{t("stats.avgPerDay")}</p>
              <p className="text-2xl font-bold">{avgListensPerDay}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-col items-start">
          <h2 className="text-lg font-semibold">{t("chart.title")}</h2>
          <p className="text-sm text-default-500">
            {t("chart.subtitle", { days })}
          </p>
        </CardHeader>
        <CardBody>
          {statistics.periodListens === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="text-default-300 mb-4" size={48} />
              <p className="text-default-500">{t("chart.noData")}</p>
            </div>
          ) : (
            <ListenChart data={statistics.dailyStats} />
          )}
        </CardBody>
      </Card>

      {/* Peak day info */}
      {peakDay && (
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">
              {t("peakDay", {
                date: new Date(peakDay.date).toLocaleDateString(),
                count: peakDay.listens,
              })}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Audio created date */}
      <p className="text-xs text-default-400 text-center">
        {t("createdAt", {
          date: new Date(statistics.audioCreatedAt).toLocaleDateString(),
        })}
      </p>
    </div>
  );
}
