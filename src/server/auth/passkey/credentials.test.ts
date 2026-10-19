import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: { AUTH_PASSKEY_DISABLED: true, AUTH_URL: undefined },
}));

const { buildPasskeyRecords, decodeBase64 } = await import("./credentials");

// Contains bytes that differ between base64 and base64url (+ / vs - _)
const credentialIdBytes = new Uint8Array([251, 255, 191, 0, 1, 2, 62, 63]);
const publicKeyBytes = new Uint8Array([1, 2, 3, 4]);

const records = buildPasskeyRecords({
  userId: "user-1",
  registration: {
    credentialID: credentialIdBytes,
    credentialPublicKey: publicKeyBytes,
    counter: 0,
    credentialDeviceType: "multiDevice",
    credentialBackedUp: true,
    aaguid: "fbfc3007-154e-4ecc-8c0b-6e020557d7bd",
  },
  transports: ["internal", "hybrid"],
  label: "MacBook",
});

describe("buildPasskeyRecords", () => {
  it("is found by Auth.js' credential lookup during sign-in", () => {
    // Auth.js normalizes the browser's base64url credential id via standard base64
    const browserCredentialId =
      Buffer.from(credentialIdBytes).toString("base64url");
    const authJsLookupId = Buffer.from(browserCredentialId, "base64").toString(
      "base64",
    );
    expect(records.authenticator.credentialID).toBe(authJsLookupId);
  });

  it("links the account via the credential id for the passkey provider", () => {
    expect(records.account).toEqual({
      userId: "user-1",
      type: "webauthn",
      provider: "passkey",
      providerAccountId: records.authenticator.credentialID,
    });
    expect(records.authenticator.providerAccountId).toBe(
      records.account.providerAccountId,
    );
  });

  it("stores keys decodable to the original bytes", () => {
    expect(decodeBase64(records.authenticator.credentialID)).toEqual(
      credentialIdBytes,
    );
    expect(decodeBase64(records.authenticator.credentialPublicKey)).toEqual(
      publicKeyBytes,
    );
  });

  it("stores transports, AAGUID and label", () => {
    expect(records.authenticator).toMatchObject({
      transports: "internal,hybrid",
      aaguid: "fbfc3007-154e-4ecc-8c0b-6e020557d7bd",
      label: "MacBook",
      counter: 0,
      credentialDeviceType: "multiDevice",
      credentialBackedUp: true,
    });
  });
});
