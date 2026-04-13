"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Switch,
  Textarea,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "~/trpc/react";
import { UnsavedChangesModal } from "../../global/UnsavedChangesModal";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";

interface EditPlaylistFormProps {
  playlistId: string;
}

export default function EditPlaylistForm({
  playlistId,
}: EditPlaylistFormProps) {
  const router = useRouter();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const utils = api.useUtils();
  const t = useTranslations("EditPlaylistForm");

  const [playlist] = api.playlist.getUserPlaylistById.useSuspenseQuery({
    id: playlistId,
  });

  const updatePlaylistMutation = api.playlist.updatePlaylist.useMutation({
    onSuccess: () => {
      void utils.playlist.getUserPlaylistById.invalidate({ id: playlistId });
      setIsFormDirty(false);
      setPendingNavigation(null);
    },
    onError: (error) => {
      console.error("Update playlist error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitForm(e.currentTarget);
  };

  const submitForm = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const description = formData.get("description") as string;
    const isPublic = formData.get("isPublic") !== null;

    if (!name) {
      setError(t("errors.nameRequired"));
      return;
    }

    updatePlaylistMutation.mutate({
      id: playlistId,
      name: name,
      description: description || undefined,
      isPublic,
    });
  };

  const handleFormChange = () => {
    setIsFormDirty(true);
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
    <Card>
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md font-semibold">
            {t("title", { name: playlist.name })}
          </p>
          <p className="text-small text-default-500">{t("subtitle")}</p>
        </div>
      </CardHeader>
      <CardBody>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            type="text"
            label={t("fields.name.label")}
            placeholder={t("fields.name.placeholder")}
            defaultValue={playlist.name}
            onChange={handleFormChange}
            isRequired
            variant="bordered"
            labelPlacement="outside"
            maxLength={100}
          />

          <Textarea
            name="description"
            label={t("fields.description.label")}
            placeholder={t("fields.description.placeholder")}
            defaultValue={playlist.description ?? ""}
            variant="bordered"
            labelPlacement="outside"
            onChange={handleFormChange}
            maxLength={500}
            minRows={3}
          />

          <Switch
            name="isPublic"
            defaultSelected={playlist.isPublic}
            size="sm"
            color="primary"
            onChange={handleFormChange}
          >
            {t("fields.isPublic.label")}
          </Switch>

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
              isLoading={updatePlaylistMutation.isPending}
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
