import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";

export const SUPPORTED_LOCALES = ["en", "de"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const defaultLocal = process.env.DEFAULT_LOCALE as SupportedLocale;

function normalizeLocale(value: string | undefined): SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value ?? "")
    ? (value as SupportedLocale)
    : defaultLocal;
}

async function loadMessages(
  locale: SupportedLocale,
): Promise<AbstractIntlMessages> {
  try {
    const mod: unknown = await import(`../messages/${locale}.json`);
    return (mod as { default: AbstractIntlMessages }).default;
  } catch {
    const fallback: unknown = await import("../messages/en.json"); // Absolute Fallback to English
    return (fallback as { default: AbstractIntlMessages }).default;
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value ?? defaultLocal;
  const locale = normalizeLocale(cookieLocale);

  return { locale, messages: await loadMessages(locale) };
});
