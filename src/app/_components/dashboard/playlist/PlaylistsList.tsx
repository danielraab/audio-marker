import { getServerSession } from "~/server/auth";
import { PlaylistsListClient } from "~/app/_components/dashboard/playlist/PlaylistsListClient";
import { api } from "~/trpc/server";
import { ListMusic } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function PlaylistsList() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }

  const t = await getTranslations("PlaylistsList");
  const playlists = await api.playlist.getUserPlaylists();
  const playlistCount = playlists?.length ?? 0;

  return (
    <section className="sm:min-w-md max-w-4xl mx-auto rounded-lg border border-default-200 bg-background p-3 sm:p-6">
      <header className="mb-4">
        <div className="flex flex-col">
          <p className="text-md font-semibold">
            <ListMusic className="inline" size={16} /> {t("title")}
          </p>
          <p className="text-small text-default-500">
            {t("description", { playlistCount })}
          </p>
        </div>
      </header>
      <PlaylistsListClient playlists={playlists} />
    </section>
  );
}
