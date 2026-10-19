"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { KeyRound, LogIn, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { signIn as signInWithPasskey } from "next-auth/webauthn";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { getSignInErrorKey } from "~/lib/signInError";
import type { SignInProvider } from "~/server/auth/signInProviders";

interface SignInPageProps {
  providers: SignInProvider[];
  callbackUrl: string;
  error?: string;
}

export default function SignInPage({
  providers,
  callbackUrl,
  error,
}: SignInPageProps) {
  const t = useTranslations("SignInPage");
  const [errorMessage, setErrorMessage] = useState(
    error ? t(`errors.${getSignInErrorKey(error)}`) : null,
  );

  const oauthProviders = providers.filter(
    (provider) => provider.type === "oidc" || provider.type === "oauth",
  );
  const emailProvider = providers.find((provider) => provider.type === "email");
  const passkeyProvider = providers.find(
    (provider) => provider.type === "webauthn",
  );

  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardBody className="gap-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-default-500">{t("description")}</p>
          </div>

          {errorMessage && (
            <p role="alert" className="text-small text-danger">
              {errorMessage}
            </p>
          )}

          {oauthProviders.map((provider) => (
            <Button
              key={provider.id}
              color="primary"
              startContent={<LogIn className="h-4 w-4" />}
              onPress={() => signIn(provider.id, { redirectTo: callbackUrl })}
            >
              {t("signInWith", { provider: provider.name })}
            </Button>
          ))}

          {emailProvider && (
            <EmailSignInForm
              providerId={emailProvider.id}
              callbackUrl={callbackUrl}
            />
          )}

          {passkeyProvider && (
            <PasskeySignInButton
              providerId={passkeyProvider.id}
              callbackUrl={callbackUrl}
              onError={setErrorMessage}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

interface ProviderButtonProps {
  providerId: string;
  callbackUrl: string;
}

function EmailSignInForm({ providerId, callbackUrl }: ProviderButtonProps) {
  const t = useTranslations("SignInPage");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    await signIn(providerId, { email, redirectTo: callbackUrl });
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <Input
        type="email"
        name="email"
        label={t("email.label")}
        placeholder={t("email.placeholder")}
        autoComplete="email"
        value={email}
        onValueChange={setEmail}
        isRequired
      />
      <Button
        type="submit"
        variant="flat"
        startContent={<Mail className="h-4 w-4" />}
        isLoading={isSubmitting}
      >
        {t("email.submit")}
      </Button>
    </form>
  );
}

function PasskeySignInButton({
  providerId,
  callbackUrl,
  onError,
}: ProviderButtonProps & { onError: (message: string | null) => void }) {
  const t = useTranslations("SignInPage");
  const [isSupported, setIsSupported] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => setIsSupported(browserSupportsWebAuthn()), []);

  if (!isSupported) return null;

  const handlePress = async () => {
    onError(null);
    setIsSigningIn(true);
    try {
      await signInWithPasskey(providerId, { redirectTo: callbackUrl });
    } catch (passkeyError) {
      onError(
        passkeyError instanceof Error && passkeyError.name === "NotAllowedError"
          ? t("errors.passkeyCancelled")
          : t("errors.passkey"),
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Button
      variant="bordered"
      startContent={<KeyRound className="h-4 w-4" />}
      isLoading={isSigningIn}
      onPress={handlePress}
    >
      {t("passkey")}
    </Button>
  );
}
