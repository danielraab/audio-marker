import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AudioStatisticsView } from "~/app/_components/audio/statistics/AudioStatisticsView";

interface StatisticsPageProps {
  params: Promise<{ audioId: string }>;
}

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const { audioId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  // Prefetch the statistics data
  try {
    void api.audio.getListenStatistics.prefetch({ id: audioId, days: 30 });
  } catch (error) {
    console.error("Error prefetching statistics:", error);
    notFound();
  }

  const t = await getTranslations("AudioPages");

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
          <AudioStatisticsView audioId={audioId} />
        </Suspense>
      </HydrateClient>
    </div>
  );
}

export async function generateMetadata({ params }: StatisticsPageProps) {
  const { audioId } = await params;
  const session = await auth();
  const t = await getTranslations("AudioPages.metadata");
  const fallback = {
    title: t("statisticsFallbackTitle"),
    description: t("statisticsFallbackDescription"),
  };

  if (!session?.user?.id) {
    return fallback;
  }

  try {
    const audio = await api.audio.getUserAudioById({ id: audioId });
    return {
      title: t("statisticsTitle", { name: audio.name }),
      description: t("statisticsDescription", { name: audio.name }),
    };
  } catch {
    return fallback;
  }
}
