'use client';

import { useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Card, CardBody, Chip } from "@heroui/react";
import { Globe, Lock, Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { PlaylistActionsDropdown } from "./PlaylistActionsDropdown";
import { formatTimeAgo } from "~/lib/time";
import { useLocale, useTranslations } from "next-intl";

interface PlaylistListItemProps {
  playlist: {
    id: string;
    name: string;
    description?: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    audioCount: number;
    listenCounter?: number;
    lastListenAt?: Date | null;
  };
}

export function PlaylistListItem({ playlist }: PlaylistListItemProps) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const locale = useLocale();
  const t = useTranslations('PlaylistListItem');

  const deletePlaylistMutation = api.playlist.deletePlaylist.useMutation({
    onSuccess: () => {
      router.refresh();
      onClose();
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const handleDeleteClick = () => {
    setSelectedPlaylistId(playlist.id);
    onOpen();
  };

  const handleConfirmDelete = () => {
    if (selectedPlaylistId) {
      deletePlaylistMutation.mutate({ id: selectedPlaylistId });
    }
  };

  const handleEditClick = () => {
    router.push(`/playlists/${playlist.id}/edit`);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardBody className="gap-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
              <h3 className="flex-shrink-0 text-lg font-semibold">{playlist.name}</h3>
              <div className="flex grow items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <Chip size="sm" variant="flat" color="secondary">
                    {t('audioCount', { count: playlist.audioCount })}
                  </Chip>
                  {playlist.listenCounter !== undefined && playlist.listenCounter > 0 && (
                    <Chip size="sm" variant="flat" color="primary" startContent={<Headphones size={14} />}>
                      {t('listens', { count: playlist.listenCounter })}
                    </Chip>
                  )}
                  <div className="flex items-center" title={playlist.isPublic ? t('visibility.public') : t('visibility.private')}>
                    {playlist.isPublic ? (
                      <Globe size={16} className="text-success" />
                    ) : (
                      <Lock size={16} className="text-warning" />
                    )}
                  </div>
                </div>
                <PlaylistActionsDropdown
                  playlistId={playlist.id}
                  onEditClick={handleEditClick}
                  onDeleteClick={handleDeleteClick}
                  isDeleteDisabled={deletePlaylistMutation.isPending}
                />
              </div>
            </div>
          </div>
          {playlist.description && (
            <p className="text-sm text-default-600 line-clamp-2">
              {playlist.description.substring(0, 100)}{playlist.description.length > 100 ? '...' : ''}
            </p>
          )}
          <div className="space-y-1 text-sm text-default-500">
            <p><span className="font-medium">{t('labels.created')}</span> {formatTimeAgo(new Date(playlist.createdAt), locale)}</p>
            <p><span className="font-medium">{t('labels.lastUpdated')}</span> {formatTimeAgo(new Date(playlist.updatedAt), locale)}</p>
            {playlist.lastListenAt && (
              <p><span className="font-medium">{t('labels.lastListened')}</span> {formatTimeAgo(new Date(playlist.lastListenAt), locale)}</p>
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
              isLoading={deletePlaylistMutation.isPending}
            >
              {t('DeleteModal.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}