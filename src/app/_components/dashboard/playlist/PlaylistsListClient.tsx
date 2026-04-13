"use client";

import { useState, useMemo } from "react";
import { Input, Pagination } from "@heroui/react";
import { Search } from "lucide-react";
import { PlaylistListItem } from "./PlaylistListItem";
import { useTranslations } from "next-intl";

interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  audioCount: number;
  listenCounter?: number;
  lastListenAt?: Date | null;
}

interface PlaylistsListClientProps {
  playlists: Playlist[];
}

const ITEMS_PER_PAGE = 10;

export function PlaylistsListClient({ playlists }: PlaylistsListClientProps) {
  const t = useTranslations("PlaylistsList");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) {
      return playlists;
    }
    const query = searchQuery.toLowerCase();
    return playlists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(query) ||
        (playlist.description?.toLowerCase().includes(query) ?? false),
    );
  }, [playlists, searchQuery]);

  const totalPages = Math.ceil(filteredPlaylists.length / ITEMS_PER_PAGE);

  const paginatedPlaylists = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlaylists.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlaylists, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("searchPlaceholder")}
        value={searchQuery}
        onValueChange={handleSearchChange}
        startContent={<Search className="text-default-400" size={18} />}
        isClearable
        onClear={() => handleSearchChange("")}
        classNames={{
          inputWrapper: "bg-default-100",
        }}
      />

      {filteredPlaylists.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-default-500">
            {searchQuery ? t("noResults") : t("empty")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedPlaylists.map((playlist) => (
              <PlaylistListItem key={playlist.id} playlist={playlist} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                color="primary"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
