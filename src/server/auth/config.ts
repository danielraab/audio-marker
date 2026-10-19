import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { env } from "~/env";
import Authentik from "next-auth/providers/authentik";
import Nodemailer from "next-auth/providers/nodemailer";
import Passkey from "next-auth/providers/passkey";

import { db } from "~/server/db";
import {
  FRESH_AUTH_PROVIDERS,
  getPasskeyAddableUntil,
  passkeyConfig,
} from "./passkey/config";
import { sendVerificationRequest } from "./verificationEmail";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    /** ISO date until which a passkey can be added, `null` without a fresh sign-in. */
    passkeyAddableUntil: string | null;
    user: {
      id: string;
      isAdmin: boolean;
      isDisabled: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin: boolean;
    isDisabled: boolean;
    // ...other properties
    // role: UserRole;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    isAdmin: boolean;
    isDisabled: boolean;
  }

  interface AdapterSession {
    freshAuthAt?: Date | null;
  }
}

const prismaAdapter = PrismaAdapter(db) as Adapter;

const adapter: Adapter = {
  ...prismaAdapter,
  updateAuthenticatorCounter: (credentialID, counter) =>
    db.authenticator.update({
      where: { credentialID },
      data: { counter, lastUsedAt: new Date() },
    }),
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    ...(env.AUTH_AUTHENTIK_ID
      ? [
          Authentik({
            name: env.AUTH_AUTHENTIK_LABEL ?? "Authentik",
            clientId: env.AUTH_AUTHENTIK_ID,
            clientSecret: env.AUTH_AUTHENTIK_SECRET,
            issuer: env.AUTH_AUTHENTIK_ISSUER,
          }),
        ]
      : []),
    ...(env.EMAIL_SERVER_HOST
      ? [
          Nodemailer({
            server: {
              host: env.EMAIL_SERVER_HOST,
              port: parseInt(env.EMAIL_SERVER_PORT ?? "587", 10),
              auth: {
                user: env.EMAIL_SERVER_USER,
                pass: env.EMAIL_SERVER_PASSWORD,
              },
            },
            from: env.EMAIL_FROM,
            sendVerificationRequest,
          }),
        ]
      : []),
    ...(passkeyConfig.enabled
      ? [
          Passkey({
            relayingParty: passkeyConfig.relyingParty,
            // Passkeys are registered on the profile page only, never via sign-up
            getUserInfo: async () => null,
            formFields: {},
            enableConditionalUI: false,
          }),
        ]
      : []),
  ],
  adapter,
  experimental: { enableWebAuthn: passkeyConfig.enabled },
  events: {
    signIn: async ({ user, account }) => {
      if (
        !user.id ||
        !account ||
        !FRESH_AUTH_PROVIDERS.includes(account.provider)
      ) {
        return;
      }
      const newestSession = await db.session.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (newestSession) {
        await db.session.update({
          where: { id: newestSession.id },
          data: { freshAuthAt: new Date() },
        });
      }
    },
  },
  callbacks: {
    session: ({ session, user }) => {
      // Block disabled users from creating sessions
      if (user.isDisabled) {
        throw new Error(
          "Your account has been disabled. Please contact an administrator.",
        );
      }

      // Whitelist fields: the database session row also contains the session token
      return {
        expires: session.expires,
        passkeyAddableUntil:
          getPasskeyAddableUntil(session.freshAuthAt ?? null)?.toISOString() ??
          null,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          isDisabled: user.isDisabled,
        },
      };
    },
    signIn: async ({ user, account, profile }) => {
      // Prevent disabled users from signing in
      if (user.isDisabled) {
        console.log(`❌ Disabled user ${user.email} attempted to sign in.`);
        return false;
      }

      // Keep avatar in sync with Authentik profile on every OAuth sign-in
      if (account?.provider === "authentik" && user.id) {
        const picture =
          typeof profile?.picture === "string" ? profile.picture : null;

        if (picture !== user.image) {
          await db.user.update({
            where: { id: user.id },
            data: { image: picture },
          });

          // Keep callback user object consistent for this request lifecycle
          user.image = picture;
        }
      }

      // Check if registration is enabled for email provider (new users only)
      if (account?.provider === "nodemailer") {
        // Check if this is a new user (no existing user record)
        const existingUser = await db.user.findUnique({
          where: { email: user.email ?? undefined },
        });

        if (!existingUser) {
          // This is a new registration attempt, check if registration is enabled
          if (!env.MAIL_REGISTRATION_ENABLED) {
            console.log(
              `❌ Registration attempt blocked for ${user.email} - registration is disabled.`,
            );
            return false;
          }
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
