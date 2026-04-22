"use client";

import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import { useTranslations } from "next-intl";

interface SignInFormProps {
  hasAuthentik: boolean;
  authentikLabel: string;
  hasEmail: boolean;
}

export default function SignInForm({
  hasAuthentik,
  authentikLabel,
  hasEmail,
}: SignInFormProps) {
  const t = useTranslations("SignIn");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    const { error: err } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/",
    });
    setIsSending(false);
    if (err) {
      setError(err.message ?? "An error occurred");
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      {hasAuthentik && (
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-default-300 bg-default-100 px-4 py-2.5 text-sm font-medium hover:bg-default-200 transition-colors"
          onClick={() =>
            authClient.signIn.oauth2({
              providerId: "authentik",
              callbackURL: "/",
            })
          }
        >
          {t("authentikButton", { name: authentikLabel })}
        </button>
      )}

      {hasAuthentik && hasEmail && (
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-default-300" />
          <span className="text-sm text-default-400">{t("orDivider")}</span>
          <div className="flex-1 border-t border-default-300" />
        </div>
      )}

      {hasEmail && !sent && (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("emailLabel")}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="rounded-lg border border-default-300 bg-default-100 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={isSending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isSending ? t("sendingButton") : t("sendLinkButton")}
          </button>
        </form>
      )}

      {hasEmail && sent && (
        <p className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          {t("linkSent")}
        </p>
      )}
    </div>
  );
}
