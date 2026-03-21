"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { api } from "~/trpc/react";
import { useTranslations } from "next-intl";

export default function SystemSettingsSection() {
  const t = useTranslations('GeneralSettings');
  const utils = api.useUtils();

  const { data: settings, isLoading: isRegStatusLoading } = api.admin.systemSettings.getRegistrationStatus.useQuery();
  const { data: headData, isLoading: isHeadLoading } = api.admin.systemSettings.getHeadInjection.useQuery();

  const [headValue, setHeadValue] = useState<string | null>(null);

  const setHeadMutation = api.admin.systemSettings.setHeadInjection.useMutation({
    onSuccess: () => {
      void utils.admin.systemSettings.getHeadInjection.invalidate();
    },
  });

  if (isRegStatusLoading || isHeadLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex min-h-[400px] items-center justify-center">
            <Spinner size="lg" label={t('loading')} />
          </div>
        </CardBody>
      </Card>
    );
  }

  const registrationEnabled = settings?.registrationEnabled ?? true;
  const currentHead = headValue ?? headData?.value ?? "";

  const handleSaveHead = () => {
    setHeadMutation.mutate({ value: currentHead });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{t('authSettings.title')}</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium">{t('authSettings.emailRegistration.title')}</h4>
              <p className="text-sm text-default-500">
                {t('authSettings.emailRegistration.description', { status: registrationEnabled ? t('authSettings.status.enabled') : t('authSettings.status.disabled') })}
              </p>
              <p className="text-xs text-default-400 mt-2">
                {t('authSettings.emailRegistration.note')}
              </p>
            </div>
            <Chip
              color={registrationEnabled ? "success" : "default"}
              variant="flat"
            >
              {registrationEnabled ? t('authSettings.status.enabled') : t('authSettings.status.disabled')}
            </Chip>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{t('headInjection.title')}</h3>
        </CardHeader>
        <CardBody className="gap-4">
          <p className="text-sm text-default-500">{t('headInjection.description')}</p>
          <Textarea
            label={t('headInjection.label')}
            placeholder={t('headInjection.placeholder')}
            value={currentHead}
            onValueChange={(v) => setHeadValue(v)}
            minRows={6}
            classNames={{ input: "font-mono text-sm" }}
          />
          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={handleSaveHead}
              isLoading={setHeadMutation.isPending}
            >
              {t('headInjection.save')}
            </Button>
          </div>
          {setHeadMutation.isSuccess && (
            <p className="text-sm text-success">{t('headInjection.saveSuccess')}</p>
          )}
          {setHeadMutation.isError && (
            <p className="text-sm text-danger">{t('headInjection.saveError')}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}