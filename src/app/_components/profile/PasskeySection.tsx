"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { startRegistration } from "@simplewebauthn/browser";
import { Info, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PASSKEY_LABEL_MAX_LENGTH } from "~/lib/passkey";
import { api } from "~/trpc/react";
import PasskeyListItem from "./PasskeyListItem";

function useIsBefore(isoDate: string | null): boolean {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isoDate) return;
    const remainingMs = new Date(isoDate).getTime() - Date.now();
    if (remainingMs <= 0) return;
    const timeout = setTimeout(() => setNow(Date.now()), remainingMs);
    return () => clearTimeout(timeout);
  }, [isoDate]);

  return isoDate !== null && now < new Date(isoDate).getTime();
}

export default function PasskeySection() {
  const t = useTranslations("PasskeySection");
  const utils = api.useUtils();
  const [label, setLabel] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = api.passkey.list.useQuery();
  const getRegistrationOptions =
    api.passkey.getRegistrationOptions.useMutation();
  const verifyRegistration = api.passkey.verifyRegistration.useMutation();

  const isWindowOpen = useIsBefore(data?.addableUntil ?? null);
  const isLimitReached = !!data && data.passkeys.length >= data.maxPasskeys;

  const getRegistrationErrorMessage = (registrationError: unknown) => {
    if (registrationError instanceof Error) {
      if (registrationError.name === "NotAllowedError")
        return t("errors.cancelled");
      if (registrationError.name === "InvalidStateError")
        return t("errors.alreadyRegistered");
      return registrationError.message;
    }
    return t("errors.generic");
  };

  const handleAddPasskey = async () => {
    setError(null);
    setIsRegistering(true);
    try {
      const options = await getRegistrationOptions.mutateAsync();
      const response = await startRegistration(options);
      await verifyRegistration.mutateAsync({ response, label });
      setLabel("");
      await utils.passkey.list.invalidate();
    } catch (registrationError) {
      setError(getRegistrationErrorMessage(registrationError));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <section>
      <h2 className="mb-1 text-2xl font-bold">{t("title")}</h2>
      <p className="mb-4 text-default-500">{t("description")}</p>

      <Card className="mb-4">
        <CardBody className="gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <Input
              className="min-w-50 flex-1"
              label={t("add.labelField")}
              placeholder={t("add.labelPlaceholder")}
              value={label}
              onValueChange={setLabel}
              maxLength={PASSKEY_LABEL_MAX_LENGTH}
              isDisabled={!isWindowOpen || isLimitReached}
            />
            <Button
              color="primary"
              startContent={!isRegistering && <Plus className="h-4 w-4" />}
              isLoading={isRegistering}
              isDisabled={!isWindowOpen || isLimitReached}
              onPress={() => void handleAddPasskey()}
            >
              {t("add.button")}
            </Button>
          </div>
          {isLimitReached ? (
            <InfoText>
              {t("info.limitReached", { max: data.maxPasskeys })}
            </InfoText>
          ) : isWindowOpen && data?.addableUntil ? (
            <InfoText>
              {t("info.windowOpen", {
                time: new Date(data.addableUntil).toLocaleTimeString(
                  undefined,
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                ),
              })}
            </InfoText>
          ) : (
            <InfoText>{t("info.windowClosed")}</InfoText>
          )}
          {error && (
            <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : data && data.passkeys.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-default-500">
            {t("count", { count: data.passkeys.length, max: data.maxPasskeys })}
          </p>
          {data.passkeys.map((passkey) => (
            <PasskeyListItem key={passkey.id} passkey={passkey} />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <p className="text-default-500">{t("empty")}</p>
          </CardBody>
        </Card>
      )}
    </section>
  );
}

function InfoText({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-default-500">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
