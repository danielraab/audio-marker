import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import SettingsPage from "~/app/_components/settings/SettingsPage";

export default async function Settings() {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user) {
    redirect("/");
  }

  // Redirect if not admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  return <SettingsPage />;
}
