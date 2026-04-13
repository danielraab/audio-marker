"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTranslations } from "next-intl";

interface ListenChartProps {
  data: { date: string; listens: number }[];
  translationNamespace?: "AudioStatistics" | "PlaylistStatistics";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  translationNamespace: "AudioStatistics" | "PlaylistStatistics";
}

function CustomTooltip({
  active,
  payload,
  label,
  translationNamespace,
}: CustomTooltipProps) {
  const t = useTranslations(translationNamespace);

  if (active && payload?.length && label) {
    const date = new Date(label);
    const count = payload[0]?.value ?? 0;
    return (
      <div className="bg-content1 border border-divider rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">
          {date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p className="text-sm text-primary">
          {t("chart.tooltipListens", { count })}
        </p>
      </div>
    );
  }
  return null;
}

export function ListenChart({
  data,
  translationNamespace = "AudioStatistics",
}: ListenChartProps) {
  // Format date labels based on data length
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (data.length <= 14) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    if (data.length <= 31) {
      return date.getDate().toString();
    }
    return date.toLocaleDateString(undefined, { month: "short" });
  };

  // Determine tick interval based on data length
  const getTickInterval = () => {
    if (data.length <= 14) return 0;
    if (data.length <= 31) return 2;
    if (data.length <= 90) return 6;
    return 29;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorListens" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--heroui-primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--heroui-primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
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
          <Tooltip
            content={
              <CustomTooltip translationNamespace={translationNamespace} />
            }
          />
          <Area
            type="monotone"
            dataKey="listens"
            stroke="hsl(var(--heroui-primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorListens)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
