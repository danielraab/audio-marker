import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import type { AdapterAccount, AdapterAuthenticator } from "next-auth/adapters";
import { PASSKEY_PROVIDER_ID } from "./config";

export interface VerifiedRegistration {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  aaguid: string;
}

/**
 * Builds the Account and Authenticator rows in exactly the shape Auth.js reads
 * when signing in with a passkey (standard base64 encoding, account linked via
 * `providerAccountId = credentialID`).
 */
export function buildPasskeyRecords(input: {
  userId: string;
  registration: VerifiedRegistration;
  transports: AuthenticatorTransportFuture[] | undefined;
  label: string | null;
}) {
  const { userId, registration, transports, label } = input;
  const credentialID = encodeBase64(registration.credentialID);

  return {
    account: {
      userId,
      type: "webauthn",
      provider: PASSKEY_PROVIDER_ID,
      providerAccountId: credentialID,
    } satisfies AdapterAccount,
    authenticator: {
      userId,
      credentialID,
      providerAccountId: credentialID,
      credentialPublicKey: encodeBase64(registration.credentialPublicKey),
      counter: registration.counter,
      credentialDeviceType: registration.credentialDeviceType,
      credentialBackedUp: registration.credentialBackedUp,
      transports: transports?.join(",") ?? null,
      aaguid: registration.aaguid,
      label,
    } satisfies AdapterAuthenticator & { aaguid: string; label: string | null },
  };
}

export function decodeBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
