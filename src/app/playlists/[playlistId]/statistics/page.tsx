import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
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

  const t = await getTranslations("PlaylistPages");

  return (
    <div className="w-full flex min-h-screen flex-col items-center gap-4 py-8">
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <p className="text-default-500">{t("loadingStatistics")}</p>
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
  const t = await getTranslations("PlaylistPages.metadata");
  const fallback = {
    title: t("statisticsFallbackTitle"),
    description: t("statisticsFallbackDescription"),
  };

  if (!session?.user?.id) {
    return fallback;
  }

  try {
    const playlist = await api.playlist.getUserPlaylistById({ id: playlistId });
    return {
      title: t("statisticsTitle", { name: playlist.name }),
      description: t("statisticsDescription", { name: playlist.name }),
    };
  } catch {
    return fallback;
  }
}
