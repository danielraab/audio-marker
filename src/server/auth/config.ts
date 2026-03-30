import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { env } from "~/env";
import Authentik from "next-auth/providers/authentik";
import Nodemailer from "next-auth/providers/nodemailer";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
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
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    ...(env.AUTH_AUTHENTIK_ID ? [
      Authentik({
        name: env.AUTH_AUTHENTIK_LABEL ?? "Authentik",
        clientId: env.AUTH_AUTHENTIK_ID,
        clientSecret: env.AUTH_AUTHENTIK_SECRET,
        issuer: env.AUTH_AUTHENTIK_ISSUER,
      }),
    ] : []),
    ...(env.EMAIL_SERVER_HOST ? [
      Nodemailer({
        server: {
          host: env.EMAIL_SERVER_HOST,
          port: parseInt(env.EMAIL_SERVER_PORT ?? "587"),
          auth: {
            user: env.EMAIL_SERVER_USER,
            pass: env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: env.EMAIL_FROM,
      }),
    ] : []),
  ],
  adapter: PrismaAdapter(db) as Adapter,
  callbacks: {
    session: ({ session, user }) => {
      // Block disabled users from creating sessions
      if (user.isDisabled) {
        throw new Error("Your account has been disabled. Please contact an administrator.");
      }
      
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
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
            console.log(`❌ Registration attempt blocked for ${user.email} - registration is disabled.`);
            return false;
          }
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
