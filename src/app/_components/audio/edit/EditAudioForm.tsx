"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Switch,
  Textarea,
} from "@heroui/react";
import { api } from "~/trpc/react";
import { Save } from "lucide-react";
import { UnsavedChangesModal } from "../../global/UnsavedChangesModal";
import { useTranslations } from "next-intl";

interface EditAudioFormProps {
  audioId: string;
}

export function EditAudioForm({ audioId }: EditAudioFormProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [error, setError] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Use suspense query to fetch audio details
  const [audio] = api.audio.getUserAudioById.useSuspenseQuery({ id: audioId });
  const t = useTranslations("EditAudioForm");

  // Setup mutation for updating audio
  const updateAudio = api.audio.updateAudio.useMutation({
    onSuccess: () => {
      void utils.audio.getUserAudioById.invalidate({ id: audioId });
      setIsFormDirty(false);
      setPendingNavigation(null);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleFormChange = () => {
    setIsFormDirty(true);
  };

  const submitForm = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const isPublic = formData.get("isPublic") !== null;

    if (!name) {
      setError(t("errors.nameRequired"));
      return;
    }

    updateAudio.mutate({
      id: audioId,
      name,
      description: description || undefined,
      isPublic,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitForm(e.currentTarget);
  };

  const handleNavigationAttempt = (path: string) => {
    if (isFormDirty) {
      setPendingNavigation(path);
      setShowModal(true);
      return;
    }
    router.push(path);
  };

  return (
    <Card className="mx-auto">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md font-semibold">
            {t("title", { name: audio.name })}
          </p>
          <p className="text-small text-default-500">{t("subtitle")}</p>
        </div>
      </CardHeader>
      <CardBody>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <Input
            name="name"
            type="text"
            label={t("fields.name.label")}
            placeholder={t("fields.name.placeholder")}
            defaultValue={audio.name}
            isRequired
            variant="bordered"
            labelPlacement="outside"
            onChange={handleFormChange}
            maxLength={100}
          />

          <Textarea
            name="description"
            label={t("fields.description.label")}
            placeholder={t("fields.description.placeholder")}
            defaultValue={audio.description ?? ""}
            variant="bordered"
            labelPlacement="outside"
            onChange={handleFormChange}
            maxLength={500}
            minRows={3}
          />

          <Switch
            name="isPublic"
            defaultSelected={audio.isPublic}
            size="sm"
            color="primary"
            onChange={handleFormChange}
          >
            {t("fields.isPublic.label")}
          </Switch>

          <div className="text-xs text-default-500">
            <p>
              <strong>{t("meta.originalFile")}</strong> {audio.originalFileName}
            </p>
            <p suppressHydrationWarning={true}>
              <strong>{t("meta.uploaded")}</strong>{" "}
              {new Date(audio.createdAt).toLocaleString()}
            </p>
            <p suppressHydrationWarning={true}>
              <strong>{t("meta.updated")}</strong>{" "}
              {new Date(audio.updatedAt).toLocaleString()}
            </p>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-2 justify-between">
            <Button
              color="default"
              variant="light"
              onPress={() => {
                handleNavigationAttempt("/");
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              startContent={<Save size={16} />}
              isLoading={updateAudio.isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </form>
      </CardBody>
      <UnsavedChangesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDiscard={() => {
          setShowModal(false);
          setIsFormDirty(false);
          if (pendingNavigation) {
            router.push(pendingNavigation);
          }
        }}
        onSave={() => {
          setShowModal(false);
          if (formRef.current) {
            submitForm(formRef.current);
          }
        }}
      />
    </Card>
  );
}
