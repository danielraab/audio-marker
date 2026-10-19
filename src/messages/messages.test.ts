import { describe, expect, it } from "vitest";
import de from "./de.json";
import en from "./en.json";

type Messages = { [key: string]: string | Messages };

function collectKeys(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : collectKeys(value, path);
  });
}

// Matches ICU arguments like `{name}` or `{count, plural, ...}`, skipping plural branch bodies like `one {audio}`
const PLACEHOLDER_PATTERN =
  /(?<!(?:=\d+|zero|one|two|few|many|other)\s*)\{(\w+)\s*[,}]/g;

function collectPlaceholders(message: string): string[] {
  return [
    ...new Set(
      [...message.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1] ?? ""),
    ),
  ].sort();
}

function getMessage(messages: Messages, path: string): string {
  const value = path
    .split(".")
    .reduce<string | Messages>(
      (node, key) => (node as Messages)[key] ?? "",
      messages,
    );
  return typeof value === "string" ? value : "";
}

describe("translation messages", () => {
  const enKeys = collectKeys(en);
  const deKeys = collectKeys(de);

  it("contains the same keys in English and German", () => {
    expect(deKeys.sort()).toEqual(enKeys.sort());
  });

  it("has no empty translations", () => {
    for (const key of enKeys) {
      expect(getMessage(en, key), `en: ${key}`).not.toBe("");
      expect(getMessage(de, key), `de: ${key}`).not.toBe("");
    }
  });

  it("uses the same placeholders in English and German", () => {
    for (const key of enKeys) {
      expect(collectPlaceholders(getMessage(de, key)), key).toEqual(
        collectPlaceholders(getMessage(en, key)),
      );
    }
  });
});
