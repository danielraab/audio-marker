"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
  Input,
} from "@heroui/react";
import { Plus, Search, Check } from "lucide-react";
import { api } from "~/trpc/react";
import { formatTimeAgo } from "~/lib/time";
import { useTranslations } from "next-intl";

interface AddAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  onAudioAdded: () => void;
}

export function AddAudioModal({
  isOpen,
  onClose,
  playlistId,
  onAudioAdded,
}: AddAudioModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const utils = api.useUtils();
  const t = useTranslations("AddAudioModal");
  const tAudio = useTranslations("AudioListItem");

  const { data: allAudios, isLoading } =
    api.playlist.getUserAudiosForPlaylist.useQuery(
      { playlistId },
      { enabled: isOpen },
    );

  const addAudioMutation = api.playlist.addAudioToPlaylist.useMutation({
    onSuccess: () => {
      void utils.playlist.getUserAudiosForPlaylist.invalidate({
        playlistId: playlistId,
      });
      onAudioAdded();
    },
    onError: (error) => {
      console.error("Add audio error:", error);
    },
  });

  const handleAddAudio = (audioId: string) => {
    addAudioMutation.mutate({
      playlistId,
      audioId,
    });
  };

  const filteredAudios =
    allAudios?.filter(
      (audio) =>
        audio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audio.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()),
    ) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{t("title")}</ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Search */}
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search size={16} />}
                className="mb-4"
              />

              {/* Available Audios */}
              {filteredAudios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-default-500">
                    {searchTerm ? t("empty.noMatches") : t("empty.noneFound")}
                  </p>
                  {!searchTerm && (
                    <p className="text-small text-default-400 mt-2">
                      {t("empty.suggestion")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAudios.map((audio) => (
                    <Card key={audio.id} className="shadow-sm">
                      <CardBody className="gap-2">
                        <div className="flex flex-row justify-between items-center gap-2">
                          <div className="grow flex items-center gap-2">
                            <h4 className="text-md font-semibold truncate">
                              {audio.name}
                            </h4>
                            <Chip size="sm" variant="flat" color="primary">
                              {tAudio("markers", { count: audio.markerCount })}
                            </Chip>
                          </div>
                          {audio.isInPlaylist ? (
                            <Button
                              color="success"
                              size="sm"
                              startContent={<Check size={14} />}
                              isDisabled
                              variant="flat"
                            >
                              {t("button.added")}
                            </Button>
                          ) : (
                            <Button
                              color="primary"
                              size="sm"
                              startContent={<Plus size={14} />}
                              onPress={() => handleAddAudio(audio.id)}
                              isLoading={addAudioMutation.isPending}
                            >
                              {t("button.add")}
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-default-500">
                          <p>
                            <span className="font-medium">
                              {t("labels.originalFile")}
                            </span>{" "}
                            {audio.originalFileName}
                          </p>
                          <p>
                            <span className="font-medium">
                              {t("labels.uploaded")}
                            </span>{" "}
                            {formatTimeAgo(new Date(audio.createdAt))}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            {t("close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
