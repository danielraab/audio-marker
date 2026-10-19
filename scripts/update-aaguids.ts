#!/usr/bin/env node
/**
 * Refreshes the committed snapshot of the community passkey AAGUID list,
 * used to show the vendor name and icon of a registered passkey.
 * Usage: pnpm run passkey:update-aaguids
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/aaguid.json";
const TARGET_FILE = path.resolve(
  import.meta.dirname,
  "../src/server/auth/passkey/aaguids.json",
);
const AAGUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ICON_PATTERN = /^data:image\/(svg\+xml|png|webp);base64,[A-Za-z0-9+/=]+$/;

interface VendorEntry {
  name: string;
  icon_light?: string;
  icon_dark?: string;
}

function sanitizeIcon(icon: unknown): string | undefined {
  return typeof icon === "string" && ICON_PATTERN.test(icon) ? icon : undefined;
}

async function updateAaguids() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const source = (await response.json()) as Record<string, unknown>;

  const snapshot: Record<string, VendorEntry> = {};
  for (const [aaguid, value] of Object.entries(source).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const entry = value as Partial<Record<keyof VendorEntry, unknown>>;
    if (!AAGUID_PATTERN.test(aaguid) || typeof entry.name !== "string") {
      console.warn(`⚠️  Skipping invalid entry ${aaguid}`);
      continue;
    }
    snapshot[aaguid] = {
      name: entry.name,
      icon_light: sanitizeIcon(entry.icon_light),
      icon_dark: sanitizeIcon(entry.icon_dark),
    };
  }

  await writeFile(TARGET_FILE, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `✅ Wrote ${Object.keys(snapshot).length} entries to ${TARGET_FILE}`,
  );
}

updateAaguids().catch((error: unknown) => {
  console.error("❌ Failed to update AAGUID snapshot:", error);
  process.exit(1);
});
