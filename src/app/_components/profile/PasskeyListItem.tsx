"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Check, KeyRound, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { PASSKEY_LABEL_MAX_LENGTH } from "~/lib/passkey";
import { api } from "~/trpc/react";

type Passkey = RouterOutputs["passkey"]["list"]["passkeys"][number];

export default function PasskeyListItem({ passkey }: { passkey: Passkey }) {
  const t = useTranslations("PasskeySection");
  const utils = api.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(passkey.label ?? "");

  const renameMutation = api.passkey.rename.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void utils.passkey.list.invalidate();
    },
  });
  const deleteMutation = api.passkey.delete.useMutation({
    onSuccess: () => void utils.passkey.list.invalidate(),
  });

  const vendorName = passkey.vendor.name ?? t("unknownAuthenticator");

  const handleDelete = () => {
    if (confirm(t("confirmDelete", { name: passkey.label ?? vendorName }))) {
      deleteMutation.mutate({ id: passkey.id });
    }
  };

  const cancelEditing = () => {
    setLabel(passkey.label ?? "");
    setIsEditing(false);
  };

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center gap-3">
          <VendorIcon vendor={passkey.vendor} />
          <div className="min-w-50 flex-1">
            {isEditing ? (
              <form
                className="flex items-center gap-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  renameMutation.mutate({ id: passkey.id, label });
                }}
              >
                <Input
                  size="sm"
                  aria-label={t("add.labelField")}
                  placeholder={t("add.labelPlaceholder")}
                  value={label}
                  onValueChange={setLabel}
                  maxLength={PASSKEY_LABEL_MAX_LENGTH}
                  autoFocus
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  type="submit"
                  aria-label={t("actions.save")}
                  isLoading={renameMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label={t("actions.cancel")}
                  onPress={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <h3 className="font-medium">{passkey.label ?? vendorName}</h3>
            )}
            <p className="text-sm text-default-500">
              {passkey.label && `${vendorName} • `}
              {t("createdOn", {
                date: new Date(passkey.createdAt).toLocaleDateString(),
              })}{" "}
              •{" "}
              {passkey.lastUsedAt
                ? t("lastUsedOn", {
                    date: new Date(passkey.lastUsedAt).toLocaleDateString(),
                  })
                : t("neverUsed")}
            </p>
          </div>
          {!isEditing && (
            <div className="flex gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={t("actions.rename")}
                onPress={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                aria-label={t("actions.delete")}
                isLoading={deleteMutation.isPending}
                onPress={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function VendorIcon({ vendor }: { vendor: Passkey["vendor"] }) {
  if (!vendor.iconLight || !vendor.iconDark) {
    return <KeyRound className="h-8 w-8 text-default-500" aria-hidden />;
  }
  // Icons are data URIs from the AAGUID snapshot; rendering them as images prevents SVG script execution
  return (
    <>
      <Image
        src={vendor.iconLight}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 dark:hidden"
      />
      <Image
        src={vendor.iconDark}
        alt=""
        width={32}
        height={32}
        className="hidden h-8 w-8 dark:block"
      />
    </>
  );
}
