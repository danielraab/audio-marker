import { describe, expect, it } from "vitest";
import aaguids from "./aaguids.json";
import { resolveAuthenticatorVendor } from "./vendors";

const APPLE_PASSWORDS = "fbfc3007-154e-4ecc-8c0b-6e020557d7bd";

describe("resolveAuthenticatorVendor", () => {
  it("resolves a known AAGUID to its vendor", () => {
    const vendor = resolveAuthenticatorVendor(APPLE_PASSWORDS);
    expect(vendor.name).toBe("Apple Passwords");
    expect(vendor.iconLight).toMatch(/^data:image\//);
    expect(vendor.iconDark).toMatch(/^data:image\//);
  });

  it("matches AAGUIDs case-insensitively", () => {
    expect(resolveAuthenticatorVendor(APPLE_PASSWORDS.toUpperCase()).name).toBe(
      "Apple Passwords",
    );
  });

  it.each([
    null,
    "00000000-0000-0000-0000-000000000000",
    "11111111-2222-3333-4444-555555555555",
  ])("returns an unknown vendor for %s", (aaguid) => {
    expect(resolveAuthenticatorVendor(aaguid)).toEqual({
      name: null,
      iconLight: null,
      iconDark: null,
    });
  });
});

describe("AAGUID snapshot", () => {
  it("only contains image data URIs as icons", () => {
    const icons = Object.values(aaguids).flatMap((entry) =>
      [
        (entry as { icon_light?: string }).icon_light,
        (entry as { icon_dark?: string }).icon_dark,
      ].filter(Boolean),
    );
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon).toMatch(/^data:image\/(svg\+xml|png|webp);base64,/);
    }
  });
});
