import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import SignInPage from "~/app/_components/signin/SignInPage";
import { auth } from "~/server/auth";
import { authConfig } from "~/server/auth/config";
import { toSignInProviders } from "~/server/auth/signInProviders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignInPage");
  return { title: t("title") };
}

interface SignInProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignIn({ searchParams }: SignInProps) {
  const { callbackUrl = "/", error } = await searchParams;
  const session = await auth();

  if (session?.user && !error) {
    redirect("/");
  }

  return (
    <SignInPage
      providers={toSignInProviders(authConfig.providers)}
      callbackUrl={callbackUrl}
      error={error}
    />
  );
}
