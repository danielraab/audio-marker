import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Suspense } from "react";
import { PlaylistStatisticsView } from "~/app/_components/playlist/statistics/PlaylistStatisticsView";

interface StatisticsPageProps {
  params: Promise<{ playlistId: string }>;
}

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const { playlistId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  // Prefetch the statistics data
  try {
    void api.playlist.getListenStatistics.prefetch({
      id: playlistId,
      days: 30,
    });
  } catch (error) {
    console.error("Error prefetching statistics:", error);
    notFound();
  }

  return (
    <div className="w-full flex min-h-screen flex-col items-center gap-4 py-8">
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <p className="text-default-500">Loading statistics...</p>
            </div>
          }
        >
          <PlaylistStatisticsView playlistId={playlistId} />
        </Suspense>
      </HydrateClient>
    </div>
  );
}

export async function generateMetadata({ params }: StatisticsPageProps) {
  const { playlistId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return {
      title: "Statistics - Audio Marker",
      description: "View playlist statistics",
    };
  }

  try {
    const playlist = await api.playlist.getUserPlaylistById({ id: playlistId });
    return {
      title: `Statistics - ${playlist.name} - Audio Marker`,
      description: `Listen statistics for ${playlist.name}`,
    };
  } catch {
    return {
      title: "Statistics - Audio Marker",
      description: "View playlist statistics",
    };
  }
}
