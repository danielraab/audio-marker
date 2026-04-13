"use client";

import { useState, useMemo } from "react";
import { Input, Pagination } from "@heroui/react";
import { Search } from "lucide-react";
import { AudioListItem } from "./AudioListItem";
import { useTranslations } from "next-intl";

interface Audio {
  id: string;
  name: string;
  description?: string | null;
  originalFileName: string;
  createdAt: Date;
  markerCount: number;
  isPublic: boolean;
  listenCounter?: number;
  lastListenAt?: Date | null;
}

interface AudioFilesListClientProps {
  audios: Audio[];
}

const ITEMS_PER_PAGE = 10;

export function AudioFilesListClient({ audios }: AudioFilesListClientProps) {
  const t = useTranslations("AudioFilesList");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAudios = useMemo(() => {
    if (!searchQuery.trim()) {
      return audios;
    }
    const query = searchQuery.toLowerCase();
    return audios.filter(
      (audio) =>
        audio.name.toLowerCase().includes(query) ||
        audio.originalFileName.toLowerCase().includes(query) ||
        (audio.description?.toLowerCase().includes(query) ?? false),
    );
  }, [audios, searchQuery]);

  const totalPages = Math.ceil(filteredAudios.length / ITEMS_PER_PAGE);

  const paginatedAudios = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAudios.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAudios, currentPage]);

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

      {filteredAudios.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-default-500">
            {searchQuery ? t("noResults") : t("empty")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedAudios.map((audio) => (
              <AudioListItem key={audio.id} audio={audio} />
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
