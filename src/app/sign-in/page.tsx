import { getTranslations } from "next-intl/server";
import { env } from "~/env";
import SignInForm from "./_components/SignInForm";

export default async function SignInPage() {
  const t = await getTranslations("SignIn");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <SignInForm
        hasAuthentik={!!env.AUTH_AUTHENTIK_ID}
        authentikLabel={env.AUTH_AUTHENTIK_LABEL ?? "Authentik"}
        hasEmail={!!env.EMAIL_SERVER_HOST}
      />
    </div>
  );
}
