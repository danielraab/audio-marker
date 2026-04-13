"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TREND_RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

export default function ListenTrendsCard() {
  const t = useTranslations("AdminStatistics");
  const [trendDays, setTrendDays] = useState(30);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const { data: trendsData, isLoading: trendsLoading } =
    api.admin.statistics.getListenTrends.useQuery({ days: trendDays });

  const toggleLine = (dataKey: string) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} />
          <div>
            <h3 className="text-lg font-semibold">{t("listenTrends.title")}</h3>
            <p className="text-xs text-default-400">
              {t("listenTrends.subtitle")}
            </p>
          </div>
        </div>
        <Select
          size="sm"
          className="w-40"
          selectedKeys={[String(trendDays)]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0];
            if (value) setTrendDays(Number(value));
          }}
          aria-label={t("listenTrends.timeRange")}
        >
          {TREND_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value}>{option.label}</SelectItem>
          ))}
        </Select>
      </CardHeader>
      <CardBody>
        {trendsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : trendsData?.some(
            (d) => d.audioListens > 0 || d.playlistListens > 0,
          ) ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendsData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) => {
                    const d = new Date(`${value}T00:00:00`);
                    return d.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  interval={Math.max(
                    0,
                    Math.floor((trendsData?.length ?? 0) / 8) - 1,
                  )}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    const d = new Date(`${String(value)}T00:00:00`);
                    return d.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--heroui-default-200))",
                    backgroundColor: "hsl(var(--heroui-content1))",
                  }}
                />
                <Legend
                  onClick={(e) => {
                    if (typeof e.dataKey === "string") toggleLine(e.dataKey);
                  }}
                  formatter={(value, entry) => (
                    <span
                      style={{
                        color: hiddenLines.has(entry.dataKey as string)
                          ? "hsl(var(--heroui-default-300))"
                          : undefined,
                        cursor: "pointer",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="audioListens"
                  name={t("listenTrends.audioListens")}
                  stroke="hsl(var(--heroui-primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  hide={hiddenLines.has("audioListens")}
                />
                <Line
                  type="monotone"
                  dataKey="playlistListens"
                  name={t("listenTrends.playlistListens")}
                  stroke="hsl(var(--heroui-secondary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  hide={hiddenLines.has("playlistListens")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="mb-2 text-default-300" size={32} />
            <p className="text-default-400">{t("listenTrends.noData")}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
