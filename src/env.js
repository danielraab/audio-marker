import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DEFAULT_LOCALE: z.enum(["en", "de"]).default("en"),
    DATABASE_URL: z.string().url(),

    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    AUTH_AUTHENTIK_LABEL: z.string().optional(),
    AUTH_AUTHENTIK_ID: z.string().optional(),
    AUTH_AUTHENTIK_SECRET: process.env.AUTH_AUTHENTIK_ID
      ? z.string()
      : z.string().optional(),
    AUTH_AUTHENTIK_ISSUER: process.env.AUTH_AUTHENTIK_ID
      ? z.string().url()
      : z.string().url().optional(),
    // Email configuration for magic links
    EMAIL_SERVER_HOST: z.string().optional(),
    EMAIL_SERVER_PORT: z.string().optional(),
    EMAIL_SERVER_USER: z.string().optional(),
    EMAIL_SERVER_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    MAIL_REGISTRATION_ENABLED: z
      .string()
      .transform((val) => val !== "false")
      .default("true"),

    REQUIRE_AUTH_FOR_PUBLIC_CONTENT: z
      .string()
      .transform((val) => val === "true")
      .default("false"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_ENVIRONMENT: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_LOG_LEVELS: z.string().default("log,warn,error"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    DEFAULT_LOCALE: process.env.DEFAULT_LOCALE,
    DATABASE_URL: process.env.DATABASE_URL,

    AUTH_SECRET: process.env.AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    AUTH_AUTHENTIK_LABEL: process.env.AUTH_AUTHENTIK_LABEL,
    AUTH_AUTHENTIK_ID: process.env.AUTH_AUTHENTIK_ID,
    AUTH_AUTHENTIK_SECRET: process.env.AUTH_AUTHENTIK_SECRET,
    AUTH_AUTHENTIK_ISSUER: process.env.AUTH_AUTHENTIK_ISSUER,

    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    MAIL_REGISTRATION_ENABLED: process.env.MAIL_REGISTRATION_ENABLED,

    REQUIRE_AUTH_FOR_PUBLIC_CONTENT:
      process.env.REQUIRE_AUTH_FOR_PUBLIC_CONTENT,

    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_LOG_LEVELS: process.env.NEXT_PUBLIC_SENTRY_LOG_LEVELS,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
