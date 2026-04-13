import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { EditPageContainer } from "~/app/_components/audio/edit/EditPageContainer";
import { HydrateClient } from "~/trpc/server";
import { Suspense } from "react";
import { EditAudioForm } from "~/app/_components/audio/edit/EditAudioForm";
import Link from "next/link";
import { Play, BarChart3 } from "lucide-react";

interface EditAudioPageProps {
  params: Promise<{ audioId: string }>;
}

export default async function EditAudioPage({ params }: EditAudioPageProps) {
  const { audioId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  // Prefetch the audio data
  try {
    void api.audio.getUserAudioById.prefetch({ id: audioId });
    void api.marker.getMarkers.prefetch({ audioId: audioId });
  } catch (error) {
    console.error("Error prefetching audio data:", error);
    notFound();
  }

  return (
    <div className="w-full flex min-h-screen flex-col items-center gap-4">
      <div className="w-full flex flex-col items-center mx-auto">
        <div className="flex gap-2">
          <Link
            href={`/audios/${audioId}/listen`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors"
          >
            <Play size={18} />
            Preview
          </Link>
          <Link
            href={`/audios/${audioId}/statistics`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warning bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors"
          >
            <BarChart3 size={18} />
            Statistics
          </Link>
        </div>
      </div>
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <p className="text-default-500">Loading audio details...</p>
            </div>
          }
        >
          <EditAudioForm audioId={audioId} />
          <EditPageContainer audioId={audioId} />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
