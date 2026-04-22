import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { genericOAuth } from "better-auth/plugins";
import { customSession } from "better-auth/plugins";
import { cache } from "react";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import nodemailer from "nodemailer";
import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "sqlite" }),
  secret: env.AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["authentik"],
    },
  },

  user: {
    additionalFields: {
      isAdmin: { type: "boolean" as const, defaultValue: false, input: false },
      isDisabled: {
        type: "boolean" as const,
        defaultValue: false,
        input: false,
      },
    },
  },

  plugins: [
    ...(env.AUTH_AUTHENTIK_ID
      ? [
          genericOAuth({
            config: [
              {
                providerId: "authentik",
                discoveryUrl: `${env.AUTH_AUTHENTIK_ISSUER}/.well-known/openid-configuration`,
                clientId: env.AUTH_AUTHENTIK_ID,
                clientSecret: env.AUTH_AUTHENTIK_SECRET ?? "",
                scopes: ["openid", "email", "profile"],
                overrideUserInfo: true,
                mapProfileToUser: (profile: Record<string, unknown>) => ({
                  name:
                    typeof profile.name === "string"
                      ? profile.name
                      : ((profile.preferred_username as string | undefined) ??
                        ""),
                  image:
                    typeof profile.picture === "string"
                      ? profile.picture
                      : null,
                }),
              },
            ],
          }),
        ]
      : []),

    ...(env.EMAIL_SERVER_HOST
      ? [
          magicLink({
            disableSignUp: !env.MAIL_REGISTRATION_ENABLED,
            sendMagicLink: async ({ email, url }) => {
              const transporter = nodemailer.createTransport({
                host: env.EMAIL_SERVER_HOST,
                port: Number(env.EMAIL_SERVER_PORT ?? "587"),
                auth: {
                  user: env.EMAIL_SERVER_USER,
                  pass: env.EMAIL_SERVER_PASSWORD,
                },
              });
              await transporter.sendMail({
                from: env.EMAIL_FROM,
                to: email,
                subject: "Sign in to Audio Marker",
                text: `Click the link to sign in: ${url}`,
                html: `<p>Click the link to sign in:</p><p><a href="${url}">${url}</a></p>`,
              });
            },
          }),
        ]
      : []),

    customSession(async ({ user, session }) => {
      return { user, session };
    }),
  ],

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { isDisabled: true },
          });
          if (user?.isDisabled) {
            throw new APIError("FORBIDDEN", {
              message:
                "Your account has been disabled. Please contact an administrator.",
            });
          }
          return { data: session };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

const uncachedGetServerSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      isAdmin: (session.user as { isAdmin?: boolean }).isAdmin ?? false,
      isDisabled:
        (session.user as { isDisabled?: boolean }).isDisabled ?? false,
    },
  };
};

export const getServerSession = cache(uncachedGetServerSession);
