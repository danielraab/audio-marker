import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { env } from "~/env";
import * as Sentry from "@sentry/nextjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { auth } from "~/server/auth";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = async (req: NextRequest) => {
  // Resolve the current session so we can enrich Sentry events with user info
  const session = await auth();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error, input: _input, type }) => {
      // Capture in Sentry with helpful context, including user when available
      Sentry.withScope((scope) => {
        if (session?.user) {
          const user = session.user;
          scope.setUser({
            id: user.id,
            email: user.email ?? undefined,
            username: user.name ?? undefined,
          });
          // Add useful flags as tags
          scope.setTags({
            isAdmin: String(user.isAdmin ?? false),
            isDisabled: String(user.isDisabled ?? false),
          });
        }

        // Add tRPC-specific context (avoid including raw input to prevent PII leakage)
        scope.setContext("trpc", {
          path: path ?? "<no-path>",
          type,
        });

        Sentry.captureException(error);
      });

      if (env.NODE_ENV === "development") {
        console.error(
          `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
        );
      }
    },
  });
};

export { handler as GET, handler as POST };
