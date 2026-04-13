"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Switch,
  Card,
  CardBody,
  CardHeader,
  Textarea,
} from "@heroui/react";
import { ListMusic, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useTranslations } from "next-intl";

export function CreatePlaylistForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("CreatePlaylistForm");

  const createPlaylistMutation = api.playlist.createPlaylist.useMutation({
    onSuccess: () => {
      setName("");
      setDescription("");
      setIsPublic(false);
      setIsExpanded(false);
      router.refresh();
    },
    onError: (error) => {
      console.error("Create playlist error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createPlaylistMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setIsPublic(false);
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          color="primary"
          startContent={<Plus size={16} />}
          onPress={() => setIsExpanded(true)}
        >
          {t("cta")} <ListMusic />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("name.label")}
              placeholder={t("name.placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
              maxLength={100}
              description={t("name.description")}
              autoFocus
            />

            <Textarea
              label={t("description.label")}
              placeholder={t("description.placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              minRows={3}
            />

            <div className="flex items-center gap-2">
              <Switch
                isSelected={isPublic}
                onValueChange={setIsPublic}
                size="sm"
              >
                {t("visibility.makePublic")}
              </Switch>
            </div>

            <div className="flex justify-betweens gap-2">
              <Button
                type="button"
                variant="light"
                onPress={handleCancel}
                isDisabled={createPlaylistMutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={createPlaylistMutation.isPending}
                isDisabled={!name.trim()}
              >
                {t("submit")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
