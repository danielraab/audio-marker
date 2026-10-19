export type SignInErrorKey =
  | "accessDenied"
  | "verification"
  | "accountNotLinked"
  | "passkey"
  | "default";

const SIGN_IN_ERROR_KEYS = new Map<string, SignInErrorKey>([
  ["AccessDenied", "accessDenied"],
  ["Verification", "verification"],
  ["OAuthAccountNotLinked", "accountNotLinked"],
  ["AccountNotLinked", "accountNotLinked"],
  ["WebAuthnVerificationError", "passkey"],
]);

/** Maps an Auth.js `error` query parameter to a translation key. */
export function getSignInErrorKey(error: string): SignInErrorKey {
  return SIGN_IN_ERROR_KEYS.get(error) ?? "default";
}
