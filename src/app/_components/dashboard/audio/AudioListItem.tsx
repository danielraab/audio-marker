'use client';

import { useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Card, CardBody, Chip } from "@heroui/react";
import { Globe, Lock, Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { AudioActionsDropdown } from "./AudioActionsDropdown";
import { formatTimeAgo } from "~/lib/time";
import { useLocale, useTranslations } from "next-intl";

interface AudioListItemProps {
  audio: {
    id: string;
    name: string;
    description?: string | null;
    originalFileName: string;
    createdAt: Date;
    markerCount: number;
    isPublic: boolean;
    listenCounter?: number;
    lastListenAt?: Date | null;
  };
}

export function AudioListItem({ audio }: AudioListItemProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const locale = useLocale();
  const t = useTranslations("AudioListItem");

  const deleteAudioMutation = api.audio.deleteAudio.useMutation({
    onSuccess: () => {
      router.refresh();
      onClose();
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const handleDeleteClick = () => {
    setSelectedAudioId(audio.id);
    onOpen();
  };

  const handleConfirmDelete = () => {
    if (selectedAudioId) {
      deleteAudioMutation.mutate({ id: selectedAudioId });
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardBody className="gap-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1 flex-wrap">
              <h3 className="flex-shrink-0 text-lg font-semibold">{audio.name}</h3>
              <div className="flex grow items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <Chip size="sm" variant="flat" color="primary">
                    {t('markers', { count: audio.markerCount })}
                  </Chip>
                  {audio.listenCounter !== undefined && audio.listenCounter > 0 && (
                    <Chip size="sm" variant="flat" color="secondary" startContent={<Headphones size={14} />}>
                      {t('listens', { count: audio.listenCounter })}
                    </Chip>
                  )}
                  <div className="flex items-center" title={audio.isPublic ? t('visibility.public') : t('visibility.private')}>
                    {audio.isPublic ? (
                      <Globe size={16} className="text-success" />
                    ) : (
                      <Lock size={16} className="text-warning" />
                    )}
                  </div>
                </div>
                <AudioActionsDropdown
                  audioId={audio.id}
                  onDeleteClick={handleDeleteClick}
                  isDeleteDisabled={deleteAudioMutation.isPending}
                />
              </div>
            </div>
          </div>
          {audio.description && (
            <p className="text-sm text-default-600 line-clamp-2">
              {audio.description.substring(0, 100)}{audio.description.length > 100 ? '...' : ''}
            </p>
          )}
          <div className="space-y-1 text-sm text-default-500">
            <p className="break-words"><span className="font-medium">{t('labels.originalFileName')}</span> {audio.originalFileName}</p>
            <p><span className="font-medium">{t('labels.uploaded')}</span> {formatTimeAgo(new Date(audio.createdAt), locale)}</p>
            {audio.lastListenAt && (
              <p><span className="font-medium">{t('labels.lastListened')}</span> {formatTimeAgo(new Date(audio.lastListenAt), locale)}</p>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">{t('DeleteModal.title')}</ModalHeader>
          <ModalBody>
            <p>{t('DeleteModal.body')}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              {t('DeleteModal.cancel')}
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDelete}
              isLoading={deleteAudioMutation.isPending}
            >
              {t('DeleteModal.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}