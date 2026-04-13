import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { ListenPlaylistView } from "~/app/_components/playlist/listen/ListenPlaylistView";
import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { VisibilityBanner } from "~/app/_components/global/VisibilityBanner";
import { env } from "~/env";
import { BarChart3, Edit } from "lucide-react";
import Link from "next/link";

interface ListenPlaylistPageProps {
  params: Promise<{
    playlistId: string;
  }>;
}

export default async function ListenPlaylistPage({
  params,
}: ListenPlaylistPageProps) {
  const { playlistId } = await params;
  const session = await auth();

  // If authentication is required for public content and user is not logged in, redirect to not found
  if (env.REQUIRE_AUTH_FOR_PUBLIC_CONTENT && !session) {
    notFound();
  }

  try {
    const playlist = session
      ? await api.playlist.getUserPlaylistById({ id: playlistId })
      : await api.playlist.getPublicPlaylistById({ id: playlistId });

    // Check if user has access
    const isCreator = session?.user?.id === playlist.createdBy.id;
    if (!(playlist.isPublic || isCreator)) {
      notFound();
    }

    return (
      <HydrateClient>
        <VisibilityBanner isPublic={playlist.isPublic} isCreator={isCreator} />
        {isCreator && (
          <div className="w-full flex justify-center gap-2 max-w-4xl mx-auto px-4 mb-4">
            <Link
              href={`/playlists/${playlistId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              <Edit size={18} />
              Edit Playlist
            </Link>
            <Link
              href={`/playlists/${playlistId}/statistics`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warning bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors"
            >
              <BarChart3 size={18} />
              Statistics
            </Link>
          </div>
        )}
        <ListenPlaylistView playlist={playlist} />
      </HydrateClient>
    );
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: ListenPlaylistPageProps) {
  const { playlistId } = await params;
  const session = await auth();
  try {
    const playlist = session
      ? await api.playlist.getUserPlaylistById({ id: playlistId })
      : await api.playlist.getPublicPlaylistById({ id: playlistId });
    return {
      title: `${playlist.name} - Playlist`,
      description: `Listen to ${playlist.name}`,
    };
  } catch {
    return {
      title: "Playlist",
      description: "Listen to playlists",
    };
  }
}
