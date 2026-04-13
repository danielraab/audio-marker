"use client";

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Check,
  Link2,
  BarChart3,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

interface PlaylistActionsDropdownProps {
  playlistId: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
  isDeleteDisabled?: boolean;
}

export function PlaylistActionsDropdown({
  playlistId,
  onEditClick,
  onDeleteClick,
  isDeleteDisabled = false,
}: PlaylistActionsDropdownProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const t = useTranslations("PlaylistActionsDropdown");

  const handleCopyLink = useCallback(async () => {
    const listenUrl = `${window.location.origin}/playlists/${playlistId}/listen`;
    try {
      await navigator.clipboard.writeText(listenUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }, [playlistId]);

  return (
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
          key="listen"
          startContent={<Play size={16} />}
          href={`/playlists/${playlistId}/listen`}
          className="text-success"
          color="success"
        >
          {t("listen")}
        </DropdownItem>
        <DropdownItem
          key="copy"
          startContent={copySuccess ? <Check size={16} /> : <Link2 size={16} />}
          onPress={handleCopyLink}
          className={copySuccess ? "text-success" : ""}
        >
          {copySuccess ? t("copied") : t("copyListenLink")}
        </DropdownItem>
        <DropdownItem
          key="edit"
          startContent={<Edit size={16} />}
          onPress={onEditClick}
          className="text-primary"
          color="primary"
        >
          {t("edit")}
        </DropdownItem>
        <DropdownItem
          key="statistics"
          startContent={<BarChart3 size={16} />}
          href={`/playlists/${playlistId}/statistics`}
          className="text-warning"
          color="warning"
        >
          {t("statistics")}
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
  );
}
