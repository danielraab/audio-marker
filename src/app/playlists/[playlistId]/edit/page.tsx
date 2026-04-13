import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { PlaylistEditContainer } from "~/app/_components/playlist/edit/PlaylistEditContainer";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import EditPlaylistForm from "~/app/_components/playlist/edit/EditPlaylistForm";
import Link from "next/link";
import { Play } from "lucide-react";

interface PlaylistEditPageProps {
  params: Promise<{
    playlistId: string;
  }>;
}

export default async function PlaylistEditPage({
  params,
}: PlaylistEditPageProps) {
  const { playlistId } = await params;
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  try {
    void api.playlist.getUserPlaylistById.prefetch({ id: playlistId });
  } catch (error) {
    console.error("Error prefetching playlist data:", error);
    notFound();
  }

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <p className="text-default-500">Loading playlist details...</p>
          </div>
        }
      >
        <div className="w-full text-center max-w-4xl px-4">
          <Link
            href={`/playlists/${playlistId}/listen`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors"
          >
            <Play size={18} />
            Listen
          </Link>
        </div>
        <EditPlaylistForm playlistId={playlistId} />
        <PlaylistEditContainer playlistId={playlistId} />
      </Suspense>
    </HydrateClient>
  );
}
