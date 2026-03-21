/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
// Sentry wrapper (imported lazily to avoid build issues if not installed yet)
import * as Sentry from "@sentry/nextjs";
import { execSync } from "child_process";
import createNextIntlPlugin from "next-intl/plugin";

// Get git version at build time
// Priority: environment variable (for Docker builds) > git tag > git hash > fallback
const getGitVersion = () => {
  // Check if already set via environment (Docker build arg)
  if (process.env.NEXT_PUBLIC_GIT_VERSION_LABEL) {
    return process.env.NEXT_PUBLIC_GIT_VERSION_LABEL;
  }

  // Try to get from git
  try {
    // First, try to get the current tag (if on a tagged commit)
    try {
      const tag = execSync("git describe --exact-match --tags HEAD 2>/dev/null")
        .toString()
        .trim();
      if (tag) return tag;
    } catch {
      // Not on a tagged commit, continue to next method
    }

    // Try to get the most recent tag with commit count and hash
    try {
      const describe = execSync(
        "git describe --tags --always --dirty 2>/dev/null",
      )
        .toString()
        .trim();
      if (describe) return describe;
    } catch {
      // No tags exist, fall back to commit hash
    }

    // Fall back to short commit hash
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (error) {
    return "dev";
  }
};

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",

  env: {
    NEXT_PUBLIC_GIT_VERSION_LABEL: getGitVersion(),
  },

  // Ensure service worker and manifest are accessible
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
const configWithIntl = withNextIntl(config);

export default Sentry.withSentryConfig(configWithIntl, {
  org: "private-03t",
  project: "audio-marker",
  authToken: process.env.SENTRY_AUTH_TOKEN,


  // Only print logs for uploading source maps in CI
  //silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
