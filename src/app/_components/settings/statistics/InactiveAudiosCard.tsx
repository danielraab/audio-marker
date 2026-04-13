"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { AlertTriangle, Music, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

const TIME_RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

interface InactiveAudiosCardProps {
  onDelete?: () => void;
}

export default function InactiveAudiosCard({
  onDelete,
}: InactiveAudiosCardProps) {
  const t = useTranslations("AdminStatistics");
  const [daysInactive, setDaysInactive] = useState(30);

  const {
    data: inactiveAudios,
    isLoading: inactiveLoading,
    refetch: refetchInactive,
  } = api.admin.statistics.getInactiveAudios.useQuery({ daysInactive });

  const softDeleteMutation = api.admin.statistics.softDeleteAudio.useMutation({
    onSuccess: () => {
      void refetchInactive();
      onDelete?.();
    },
  });

  const handleSoftDelete = (id: string, name: string) => {
    if (confirm(t("inactiveAudios.confirmDelete", { name }))) {
      softDeleteMutation.mutate({ id });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-warning" />
          <h3 className="text-lg font-semibold">{t("inactiveAudios.title")}</h3>
        </div>
        <Select
          size="sm"
          className="w-40"
          selectedKeys={[String(daysInactive)]}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0];
            if (value) setDaysInactive(Number(value));
          }}
          aria-label={t("inactiveAudios.timeRange")}
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value}>{option.label}</SelectItem>
          ))}
        </Select>
      </CardHeader>
      <CardBody>
        <p className="mb-4 text-sm text-default-500">
          {t("inactiveAudios.description", { days: daysInactive })}
        </p>

        {inactiveLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : inactiveAudios && inactiveAudios.length > 0 ? (
          <div className="space-y-2">
            <p className="mb-4 text-sm">
              {t("inactiveAudios.found", { count: inactiveAudios.length })}
            </p>
            {inactiveAudios.map((audio) => (
              <div
                key={audio.id}
                className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Music className="shrink-0 text-warning" size={20} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{audio.name}</p>
                    <p className="text-xs text-default-400">
                      {t("inactiveAudios.createdBy")}{" "}
                      {audio.createdBy.name ??
                        audio.createdBy.email ??
                        t("inactiveAudios.unknown")}{" "}
                      •{" "}
                      {audio.totalListens > 0 ? (
                        <>
                          {t("inactiveAudios.lastListened", {
                            date: new Date(
                              audio.lastListenedAt!,
                            ).toLocaleDateString(),
                          })}
                        </>
                      ) : (
                        t("inactiveAudios.neverListened")
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={audio.isPublic ? "success" : "default"}
                  >
                    {audio.isPublic
                      ? t("inactiveAudios.public")
                      : t("inactiveAudios.private")}
                  </Chip>
                  <Chip size="sm" variant="flat" color="primary">
                    {t("inactiveAudios.listens", {
                      count: audio.totalListens,
                    })}
                  </Chip>
                  <Button
                    color="danger"
                    size="sm"
                    variant="flat"
                    startContent={<Trash2 size={14} />}
                    onPress={() => handleSoftDelete(audio.id, audio.name)}
                    isLoading={
                      softDeleteMutation.isPending &&
                      softDeleteMutation.variables?.id === audio.id
                    }
                  >
                    {t("inactiveAudios.delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Music className="mb-2 text-success" size={32} />
            <p className="text-success">
              {t("inactiveAudios.none", { days: daysInactive })}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
