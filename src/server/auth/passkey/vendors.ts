import aaguids from "./aaguids.json";

export interface AuthenticatorVendor {
  /** `null` when the AAGUID is unknown, missing or all zeros. */
  name: string | null;
  iconLight: string | null;
  iconDark: string | null;
}

interface VendorEntry {
  name: string;
  icon_light?: string;
  icon_dark?: string;
}

const vendorsByAaguid: Record<string, VendorEntry | undefined> = aaguids;

export function resolveAuthenticatorVendor(
  aaguid: string | null,
): AuthenticatorVendor {
  const entry = aaguid ? vendorsByAaguid[aaguid.toLowerCase()] : undefined;
  return {
    name: entry?.name ?? null,
    iconLight: entry?.icon_light ?? null,
    iconDark: entry?.icon_dark ?? entry?.icon_light ?? null,
  };
}
