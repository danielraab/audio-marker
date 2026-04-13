"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";

interface AudioStat {
  audioId: string;
  audioName: string;
  dailyStats: { date: string; listens: number }[];
}

interface AudioListenMultiChartProps {
  audioStats: AudioStat[];
}

// Distinct colors for up to 12 lines; wraps around if more
const LINE_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
  "#64748b", // slate
  "#eab308", // yellow
];

interface MultiTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

function MultiTooltip({ active, payload, label }: MultiTooltipProps) {
  const t = useTranslations("PlaylistStatistics");

  if (active && payload?.length && label) {
    const date = new Date(label);
    return (
      <div className="bg-content1 border border-divider rounded-lg p-3 shadow-lg max-w-xs">
        <p className="text-sm font-medium mb-1">
          {date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
        <div className="flex flex-col gap-0.5">
          {payload
            .filter((entry) => entry.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((entry) => (
              <p
                key={entry.dataKey}
                className="text-xs"
                style={{ color: entry.color }}
              >
                {entry.name}:{" "}
                {t("chart.tooltipListens", { count: entry.value })}
              </p>
            ))}
          {payload.every((entry) => entry.value === 0) && (
            <p className="text-xs text-default-400">{t("chart.noData")}</p>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function AudioListenMultiChart({
  audioStats,
}: AudioListenMultiChartProps) {
  if (audioStats.length === 0) return null;

  // Merge all audio daily stats into a single dataset keyed by date
  const dateMap = new Map<string, Record<string, number>>();

  for (const audio of audioStats) {
    for (const day of audio.dailyStats) {
      if (!dateMap.has(day.date)) {
        dateMap.set(day.date, {});
      }
      dateMap.get(day.date)![audio.audioId] = day.listens;
    }
  }

  // Build the merged chart data sorted by date
  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      ...Object.fromEntries(
        audioStats.map((a) => [a.audioId, values[a.audioId] ?? 0]),
      ),
    }));

  const dataLength = chartData.length;

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (dataLength <= 14) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    if (dataLength <= 31) {
      return date.getDate().toString();
    }
    return date.toLocaleDateString(undefined, { month: "short" });
  };

  const getTickInterval = () => {
    if (dataLength <= 14) return 0;
    if (dataLength <= 31) return 2;
    if (dataLength <= 90) return 6;
    return 29;
  };

  // Truncate long names for the legend
  const truncate = (name: string, max = 24) =>
    name.length > max ? `${name.slice(0, max - 1)}…` : name;

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--heroui-divider))"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            interval={getTickInterval()}
            tick={{ fontSize: 12, fill: "hsl(var(--heroui-default-500))" }}
            axisLine={{ stroke: "hsl(var(--heroui-divider))" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "hsl(var(--heroui-default-500))" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<MultiTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          {audioStats.map((audio, index) => (
            <Line
              key={audio.audioId}
              type="monotone"
              dataKey={audio.audioId}
              name={truncate(audio.audioName)}
              stroke={LINE_COLORS[index % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
