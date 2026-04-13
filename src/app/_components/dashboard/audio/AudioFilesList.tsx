import { auth } from "~/server/auth";
import { AudioFilesListClient } from "~/app/_components/dashboard/audio/AudioFilesListClient";
import { api } from "~/trpc/server";
import { Music4 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AudioFilesList() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return null;
  }

  const t = await getTranslations("AudioFilesList");
  const audios = await api.audio.getUserAudios();
  const audioCount = audios?.length ?? 0;

  return (
    <section className="sm:min-w-md max-w-4xl mx-auto rounded-lg border border-default-200 bg-background p-3 sm:p-6">
      <header className="mb-4">
        <div className="flex flex-col">
          <p className="text-md font-semibold">
            <Music4 className="inline" size={16} /> {t("title")}
          </p>
          <p className="text-small text-default-500">
            {t("description", { audioCount })}
          </p>
        </div>
      </header>
      <AudioFilesListClient audios={audios} />
    </section>
  );
}
