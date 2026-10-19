import { env } from "~/env";

export const PASSKEY_PROVIDER_ID = "passkey";
export const PASSKEY_REGISTRATION_WINDOW_MS = 5 * 60 * 1000;
export const MAX_PASSKEYS_PER_USER = 10;
/** Providers whose sign-in opens the passkey registration window. */
export const FRESH_AUTH_PROVIDERS: readonly string[] = [
  "authentik",
  "nodemailer",
];

export interface RelyingParty {
  id: string;
  name: string;
  origin: string;
}

export type PasskeyConfig =
  | { enabled: false }
  | { enabled: true; relyingParty: RelyingParty };

export function resolvePasskeyConfig(options: {
  disabled: boolean;
  authUrl: string | undefined;
}): PasskeyConfig {
  if (options.disabled || !options.authUrl) {
    return { enabled: false };
  }
  const url = new URL(options.authUrl);
  return {
    enabled: true,
    relyingParty: {
      id: url.hostname,
      name: "Audio Marker",
      origin: url.origin,
    },
  };
}

export const passkeyConfig = resolvePasskeyConfig({
  disabled: env.AUTH_PASSKEY_DISABLED,
  authUrl: env.AUTH_URL,
});

if (
  !env.AUTH_PASSKEY_DISABLED &&
  !env.AUTH_URL &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  console.warn(
    "⚠️  Passkeys are disabled because AUTH_URL is not set. Set AUTH_URL or AUTH_PASSKEY_DISABLED=true to silence this warning.",
  );
}

export function getPasskeyAddableUntil(freshAuthAt: Date | null): Date | null {
  return freshAuthAt
    ? new Date(freshAuthAt.getTime() + PASSKEY_REGISTRATION_WINDOW_MS)
    : null;
}

export function isRegistrationWindowOpen(
  addableUntil: string | null,
  now: Date = new Date(),
): boolean {
  return addableUntil !== null && now < new Date(addableUntil);
}
