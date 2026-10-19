import { PASSKEY_PROVIDER_ID } from "./config";

/**
 * Detects requests for Auth.js' built-in passkey registration options.
 * Registration is handled by the passkey tRPC router instead, which enforces
 * the fresh sign-in window, the per-user limit and stores the AAGUID.
 */
export function isAuthJsPasskeyRegistrationRequest(request: Request): boolean {
  const url = new URL(request.url);
  return (
    url.pathname.endsWith(`/webauthn-options/${PASSKEY_PROVIDER_ID}`) &&
    url.searchParams.get("action") === "register"
  );
}
