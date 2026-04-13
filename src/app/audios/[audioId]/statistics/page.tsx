import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Suspense } from "react";
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
          <AudioStatisticsView audioId={audioId} />
        </Suspense>
      </HydrateClient>
    </div>
  );
}

export async function generateMetadata({ params }: StatisticsPageProps) {
  const { audioId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return {
      title: "Statistics - Audio Marker",
      description: "View audio statistics",
    };
  }

  try {
    const audio = await api.audio.getUserAudioById({ id: audioId });
    return {
      title: `Statistics - ${audio.name} - Audio Marker`,
      description: `Listen statistics for ${audio.name}`,
    };
  } catch {
    return {
      title: "Statistics - Audio Marker",
      description: "View audio statistics",
    };
  }
}
