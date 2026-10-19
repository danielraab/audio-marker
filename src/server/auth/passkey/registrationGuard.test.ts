import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: { AUTH_PASSKEY_DISABLED: true, AUTH_URL: undefined },
}));

const { isAuthJsPasskeyRegistrationRequest } = await import(
  "./registrationGuard"
);

const request = (path: string) =>
  new Request(`https://audio.example.com${path}`);

describe("isAuthJsPasskeyRegistrationRequest", () => {
  it("detects registration option requests", () => {
    expect(
      isAuthJsPasskeyRegistrationRequest(
        request("/api/auth/webauthn-options/passkey?action=register"),
      ),
    ).toBe(true);
  });

  it.each([
    "/api/auth/webauthn-options/passkey?action=authenticate",
    "/api/auth/webauthn-options/passkey",
    "/api/auth/session",
    "/api/auth/signin?action=register",
  ])("lets %s pass", (path) => {
    expect(isAuthJsPasskeyRegistrationRequest(request(path))).toBe(false);
  });
});
