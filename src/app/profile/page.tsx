import { redirect } from "next/navigation";
import ProfilePage from "~/app/_components/profile/ProfilePage";
import { auth } from "~/server/auth";
import { passkeyConfig } from "~/server/auth/passkey/config";

export default async function Profile() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <ProfilePage passkeysEnabled={passkeyConfig.enabled} />;
}
