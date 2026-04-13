"use client";

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
} from "@heroui/react";
import {
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Link2,
  Check,
  ListMusic,
  BarChart3,
} from "lucide-react";
import { useState, useCallback } from "react";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { useTranslations } from "next-intl";

interface AudioActionsDropdownProps {
  audioId: string;
  onDeleteClick: () => void;
  isDeleteDisabled?: boolean;
}

export function AudioActionsDropdown({
  audioId,
  onDeleteClick,
  isDeleteDisabled = false,
}: AudioActionsDropdownProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const t = useTranslations("AudioActionsDropdown");

  const handleCopyLink = useCallback(async () => {
    const listenUrl = `${window.location.origin}/audios/${audioId}/listen`;
    try {
      await navigator.clipboard.writeText(listenUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }, [audioId]);

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            aria-label={t("aria.actions")}
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label={t("aria.menu")}>
          <DropdownItem
            key="play"
            startContent={<Play size={16} />}
            href={`/audios/${audioId}/listen`}
            className="text-success"
            color="success"
          >
            {t("play")}
          </DropdownItem>
          <DropdownItem
            key="copy"
            startContent={
              copySuccess ? <Check size={16} /> : <Link2 size={16} />
            }
            onPress={handleCopyLink}
            className={copySuccess ? "text-success" : ""}
          >
            {copySuccess ? t("copied") : t("copyPlayLink")}
          </DropdownItem>
          <DropdownItem
            key="edit"
            startContent={<Edit size={16} />}
            href={`/audios/${audioId}/edit`}
            className="text-primary"
            color="primary"
          >
            {t("edit")}
          </DropdownItem>
          <DropdownItem
            key="statistics"
            startContent={<BarChart3 size={16} />}
            href={`/audios/${audioId}/statistics`}
            className="text-warning"
            color="warning"
          >
            {t("statistics")}
          </DropdownItem>
          <DropdownItem
            key="add-to-playlist"
            startContent={<ListMusic size={16} />}
            onPress={onOpen}
            className="text-secondary"
            color="secondary"
          >
            {t("addToPlaylist")}
          </DropdownItem>
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            startContent={<Trash2 size={16} />}
            onPress={onDeleteClick}
            isDisabled={isDeleteDisabled}
          >
            {t("delete")}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <AddToPlaylistModal isOpen={isOpen} onClose={onClose} audioId={audioId} />
    </>
  );
}
