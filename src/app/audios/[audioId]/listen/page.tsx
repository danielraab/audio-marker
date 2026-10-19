import { api } from "~/trpc/server";
import ListenOnlyAudioPlayer from "~/app/_components/audio/listen/ListenOnlyAudioPlayer";
import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { VisibilityBanner } from "~/app/_components/global/VisibilityBanner";
import { env } from "~/env";
import { BarChart3, Edit } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface ListenPageProps {
  params: Promise<{ audioId: string }>;
}

export default async function ListenPage({ params }: ListenPageProps) {
  const { audioId } = await params;
  const session = await auth();

  // If authentication is required for public content and user is not logged in, redirect to not found
  if (env.REQUIRE_AUTH_FOR_PUBLIC_CONTENT && !session) {
    notFound();
  }

  try {
    const audio = session
      ? await api.audio.getUserAudioById({ id: audioId })
      : await api.audio.getPublicAudioById({ id: audioId });
    void api.marker.getMarkers.prefetch({ audioId: audio.id });

    // Check if user has access
    const isCreator = session?.user?.id === audio.createdById;
    if (!(audio.isPublic || isCreator)) {
      notFound();
    }

    const t = await getTranslations("AudioPages");

    return (
      <div className="w-full flex flex-col items-center mx-auto py-8">
        <VisibilityBanner isPublic={audio.isPublic} isCreator={isCreator} />
        {isCreator && (
          <div className="w-full flex justify-center gap-2 max-w-4xl px-4 mb-4">
            <Link
              href={`/audios/${audio.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              <Edit size={18} />
              {t("editAudio")}
            </Link>
            <Link
              href={`/audios/${audioId}/statistics`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warning bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors"
            >
              <BarChart3 size={18} />
              {t("statistics")}
            </Link>
          </div>
        )}
        <ListenOnlyAudioPlayer
          audioUrl={`/api/audio/${audio.id}/file`}
          peaksUrl={`/api/audio/${audio.id}/peaks`}
          audioName={audio.name}
          audioDescription={audio.description}
          audioReadOnlyToken={audio.id}
          audioId={audio.id}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching audio by id:", error);
    notFound();
  }
}

export async function generateMetadata({ params }: ListenPageProps) {
  const { audioId } = await params;
  const session = await auth();
  const t = await getTranslations("AudioPages.metadata");
  try {
    const audio = session
      ? await api.audio.getUserAudioById({ id: audioId })
      : await api.audio.getPublicAudioById({ id: audioId });
    return {
      title: `${audio.name} - Audio Marker`,
      description:
        audio.description ?? t("listenDescription", { name: audio.name }),
    };
  } catch {
    return {
      title: t("listenTitle"),
      description: t("listenFallbackDescription"),
    };
  }
}
