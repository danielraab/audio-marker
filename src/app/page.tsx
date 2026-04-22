import CreateAudioForm from "~/app/_components/dashboard/audio/CreateAudioForm";
import { getServerSession } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import PublicLandingPage from "./_components/dashboard/publicLandingPage";
import AudioFilesList from "~/app/_components/dashboard/audio/AudioFilesList";
import { CreatePlaylistForm } from "./_components/dashboard/playlist/CreatePlaylistForm";
import PlaylistsList from "~/app/_components/dashboard/playlist/PlaylistsList";

export default async function Home() {
  const session = await getServerSession();

  return (
    <HydrateClient>
      {session?.user && (
        <>
          <div className="w-full flex flex-col justify-center gap-2">
            <CreateAudioForm />
            <AudioFilesList />
          </div>
          <div className="w-full flex flex-col justify-center gap-2">
            <CreatePlaylistForm />
            <PlaylistsList />
          </div>
        </>
      )}
      {!session?.user && <PublicLandingPage />}
    </HydrateClient>
  );
}
