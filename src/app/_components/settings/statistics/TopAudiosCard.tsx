"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RouterOutputs } from "~/trpc/react";

type TopAudio = RouterOutputs["admin"]["statistics"]["getOverallStatistics"]["topAudios"][number];

interface TopAudiosCardProps {
  topAudios: TopAudio[];
}

export default function TopAudiosCard({ topAudios }: TopAudiosCardProps) {
  const t = useTranslations("AdminStatistics");

  if (topAudios.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <TrendingUp size={20} />
        <h3 className="text-lg font-semibold">{t("topAudios.title")}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {topAudios.map((audio, index) => (
            <div
              key={audio.id}
              className="flex items-center justify-between rounded-lg bg-default-100 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <span className="font-medium">{audio.name}</span>
                  <p className="text-xs text-default-400">
                    {t("topAudios.createdBy")}{" "}
                    {audio.createdBy.name ?? audio.createdBy.email ?? t("topAudios.unknown")}
                  </p>
                </div>
              </div>
              <Chip size="sm" variant="flat" color="primary">
                {t("topAudios.listens", { count: audio.listens })}
              </Chip>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
