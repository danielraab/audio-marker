"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
} from "@heroui/react";
import { Plus } from "lucide-react";
import { api } from "~/trpc/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { PlaylistAudioItem } from "./PlaylistAudioItem";
import { AddAudioModal } from "./AddAudioModal";
import type { PlaylistWithAudios } from "~/types/Playlist";
import { useTranslations } from "next-intl";

interface PlaylistEditContainerProps {
  playlistId: string;
}

export function PlaylistEditContainer({
  playlistId,
}: PlaylistEditContainerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playlistAudios, setPlaylistAudios] = useState<
    PlaylistWithAudios["audios"]
  >([]);
  const utils = api.useUtils();
  const t = useTranslations("PlaylistEditContainer");

  // Fetch playlist data
  const [playlist] = api.playlist.getUserPlaylistById.useSuspenseQuery({
    id: playlistId,
  });

  // Initialize playlistAudios when playlist data is loaded
  useEffect(() => {
    if (playlist?.audios) {
      setPlaylistAudios(playlist.audios);
    }
  }, [playlist?.audios]);

  const reorderAudiosMutation = api.playlist.reorderPlaylistAudios.useMutation({
    onError: (error) => {
      console.error("Reorder error:", error);
    },
  });

  const removeAudioMutation = api.playlist.removeAudioFromPlaylist.useMutation({
    onSuccess: () => {
      // Refresh the playlist data
      void utils.playlist.getUserPlaylistById.invalidate({ id: playlistId });
    },
    onError: (error) => {
      console.error("Remove audio error:", error);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(playlistAudios);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (reorderedItem) {
      items.splice(result.destination.index, 0, reorderedItem);
    }

    // Update local state immediately for better UX
    setPlaylistAudios(items);

    // Update the order in the database
    const audioOrders = items.map((item, index) => ({
      audioId: item.audio.id,
      order: index,
    }));

    reorderAudiosMutation.mutate({
      playlistId,
      audioOrders,
    });
  };

  const handleRemoveAudio = (audioId: string) => {
    removeAudioMutation.mutate({
      playlistId,
      audioId,
    });
    void utils.playlist.getUserPlaylistById.invalidate({ id: playlistId });
    void utils.playlist.getUserAudiosForPlaylist.invalidate({
      playlistId: playlistId,
    });
  };

  const handleAudioAdded = () => {
    // Refresh the playlist data when audio is added
    void utils.playlist.getUserPlaylistById.invalidate({ id: playlistId });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Audio Files */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
          <h2 className="text-base sm:text-lg font-semibold">
            {t("title", { count: playlistAudios.length })}
          </h2>
          <Button
            color="primary"
            startContent={<Plus size={16} />}
            onPress={onOpen}
            size="sm"
            className="w-full sm:w-auto"
          >
            {t("addAudio")}
          </Button>
        </CardHeader>
        <CardBody className="px-3 sm:px-6">
          {playlistAudios.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-default-500">
                {t("empty.noAudios")}
              </p>
              <Button
                color="primary"
                variant="light"
                startContent={<Plus size={16} />}
                onPress={onOpen}
                size="sm"
                className="mt-2 w-full sm:w-auto"
              >
                {t("empty.addFirst")}
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="playlist-audios">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 sm:space-y-3"
                  >
                    {playlistAudios.map((playlistAudio, index) => (
                      <Draggable
                        key={playlistAudio.audio.id}
                        draggableId={playlistAudio.audio.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${
                              snapshot.isDragging ? "opacity-50" : ""
                            }`}
                          >
                            <PlaylistAudioItem
                              playlistAudio={playlistAudio}
                              onRemove={() =>
                                handleRemoveAudio(playlistAudio.audio.id)
                              }
                              isRemoving={removeAudioMutation.isPending}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardBody>
      </Card>

      {/* Add Audio Modal */}
      <AddAudioModal
        isOpen={isOpen}
        onClose={onClose}
        playlistId={playlistId}
        onAudioAdded={handleAudioAdded}
      />
    </div>
  );
}
