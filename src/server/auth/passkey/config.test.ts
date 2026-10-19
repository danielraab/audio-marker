import { describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: { AUTH_PASSKEY_DISABLED: true, AUTH_URL: undefined },
}));

const {
  PASSKEY_REGISTRATION_WINDOW_MS,
  getPasskeyAddableUntil,
  isRegistrationWindowOpen,
  resolvePasskeyConfig,
} = await import("./config");

describe("resolvePasskeyConfig", () => {
  it("is disabled when the flag is set", () => {
    expect(
      resolvePasskeyConfig({
        disabled: true,
        authUrl: "https://audio.example.com",
      }),
    ).toEqual({ enabled: false });
  });

  it("is disabled when AUTH_URL is missing", () => {
    expect(
      resolvePasskeyConfig({ disabled: false, authUrl: undefined }),
    ).toEqual({ enabled: false });
  });

  it("derives the relying party from AUTH_URL", () => {
    expect(
      resolvePasskeyConfig({
        disabled: false,
        authUrl: "https://audio.example.com:8443/some/path",
      }),
    ).toEqual({
      enabled: true,
      relyingParty: {
        id: "audio.example.com",
        name: "Audio Marker",
        origin: "https://audio.example.com:8443",
      },
    });
  });
});

describe("registration window", () => {
  const freshAuthAt = new Date("2026-01-01T10:00:00Z");

  it("has no window without a fresh sign-in", () => {
    expect(getPasskeyAddableUntil(null)).toBeNull();
    expect(isRegistrationWindowOpen(null)).toBe(false);
  });

  it("ends five minutes after the fresh sign-in", () => {
    expect(getPasskeyAddableUntil(freshAuthAt)).toEqual(
      new Date(freshAuthAt.getTime() + PASSKEY_REGISTRATION_WINDOW_MS),
    );
    expect(PASSKEY_REGISTRATION_WINDOW_MS).toBe(5 * 60 * 1000);
  });

  it("allows registration only inside the window", () => {
    const addableUntil =
      getPasskeyAddableUntil(freshAuthAt)?.toISOString() ?? null;
    const justBeforeEnd = new Date(freshAuthAt.getTime() + 4 * 60 * 1000);
    const atEnd = new Date(freshAuthAt.getTime() + 5 * 60 * 1000);
    expect(isRegistrationWindowOpen(addableUntil, justBeforeEnd)).toBe(true);
    expect(isRegistrationWindowOpen(addableUntil, atEnd)).toBe(false);
  });
});
