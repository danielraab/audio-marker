import { getTranslations } from "next-intl/server";
import { Link } from "@heroui/link";

export default async function Footer() {
  // Get version from environment (git tag, git describe, or commit hash) (it is set in the nextjs config)
  const displayVersion = process.env.NEXT_PUBLIC_GIT_VERSION_LABEL ?? "dev";
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-10 w-full flex flex-col items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 pb-4">
      <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()}</span>
          <span className="font-semibold">draab</span>
        </div>
        <span
          className="font-mono text-xs"
          title={t("versionTitle", { version: displayVersion })}
        >
          {displayVersion}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        <Link
          href="/legal"
          size="sm"
          className="text-gray-600 dark:text-gray-400"
        >
          Legal Information
        </Link>
      </div>
    </footer>
  );
}
