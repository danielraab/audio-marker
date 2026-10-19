import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PASSKEY_LABEL_MAX_LENGTH } from "~/lib/passkey";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  MAX_PASSKEYS_PER_USER,
  PASSKEY_PROVIDER_ID,
  PASSKEY_REGISTRATION_WINDOW_MS,
  isRegistrationWindowOpen,
  passkeyConfig,
} from "~/server/auth/passkey/config";
import {
  buildPasskeyRecords,
  decodeBase64,
} from "~/server/auth/passkey/credentials";
import { resolveAuthenticatorVendor } from "~/server/auth/passkey/vendors";
import type { db as Database } from "~/server/db";

const labelSchema = z
  .string()
  .trim()
  .max(PASSKEY_LABEL_MAX_LENGTH)
  .transform((label) => label || null);

const challengeIdentifier = (userId: string) =>
  `passkey-registration:${userId}`;

const passkeyProcedure = protectedProcedure.use(({ next }) => {
  if (!passkeyConfig.enabled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Passkeys are disabled",
    });
  }
  return next({ ctx: { relyingParty: passkeyConfig.relyingParty } });
});

async function assertCanRegister(
  db: typeof Database,
  userId: string,
  addableUntil: string | null,
) {
  if (!isRegistrationWindowOpen(addableUntil)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Passkeys can only be added within 5 minutes after signing in with email or Authentik",
    });
  }
  const count = await db.authenticator.count({ where: { userId } });
  if (count >= MAX_PASSKEYS_PER_USER) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `A maximum of ${MAX_PASSKEYS_PER_USER} passkeys is allowed`,
    });
  }
}

export const passkeyRouter = createTRPCRouter({
  list: passkeyProcedure.query(async ({ ctx }) => {
    const authenticators = await ctx.db.authenticator.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        credentialID: true,
        label: true,
        aaguid: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      maxPasskeys: MAX_PASSKEYS_PER_USER,
      addableUntil: ctx.session.passkeyAddableUntil,
      passkeys: authenticators.map(({ credentialID, aaguid, ...rest }) => ({
        id: credentialID,
        vendor: resolveAuthenticatorVendor(aaguid),
        ...rest,
      })),
    };
  }),

  getRegistrationOptions: passkeyProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx.session;
    await assertCanRegister(ctx.db, user.id, ctx.session.passkeyAddableUntil);

    const existing = await ctx.db.authenticator.findMany({
      where: { userId: user.id },
      select: { credentialID: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: ctx.relyingParty.name,
      rpID: ctx.relyingParty.id,
      userID: user.id,
      userName: user.email ?? user.id,
      userDisplayName: user.name ?? user.email ?? undefined,
      attestationType: "none",
      timeout: PASSKEY_REGISTRATION_WINDOW_MS,
      excludeCredentials: existing.map((authenticator) => ({
        id: decodeBase64(authenticator.credentialID),
        type: "public-key",
        transports: authenticator.transports?.split(",") as
          | AuthenticatorTransportFuture[]
          | undefined,
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
    });

    const identifier = challengeIdentifier(user.id);
    await ctx.db.$transaction([
      ctx.db.verificationToken.deleteMany({ where: { identifier } }),
      ctx.db.verificationToken.create({
        data: {
          identifier,
          token: options.challenge,
          expires: new Date(Date.now() + PASSKEY_REGISTRATION_WINDOW_MS),
        },
      }),
    ]);

    return options;
  }),

  verifyRegistration: passkeyProcedure
    .input(
      z.object({
        // Validated by verifyRegistrationResponse
        response: z.custom<RegistrationResponseJSON>(
          (value) => typeof value === "object" && value !== null,
        ),
        label: labelSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      await assertCanRegister(ctx.db, user.id, ctx.session.passkeyAddableUntil);

      const identifier = challengeIdentifier(user.id);
      const challenge = await ctx.db.verificationToken.findFirst({
        where: { identifier, expires: { gt: new Date() } },
      });
      await ctx.db.verificationToken.deleteMany({ where: { identifier } });
      if (!challenge) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration expired, please try again",
        });
      }

      let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
      try {
        verification = await verifyRegistrationResponse({
          response: input.response,
          expectedChallenge: challenge.token,
          expectedOrigin: ctx.relyingParty.origin,
          expectedRPID: ctx.relyingParty.id,
          requireUserVerification: true,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passkey registration could not be verified",
          cause: error,
        });
      }
      if (!verification.verified || !verification.registrationInfo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passkey registration could not be verified",
        });
      }

      const { account, authenticator } = buildPasskeyRecords({
        userId: user.id,
        registration: verification.registrationInfo,
        transports: input.response.response.transports,
        label: input.label ?? null,
      });
      await ctx.db.$transaction([
        ctx.db.account.create({ data: account }),
        ctx.db.authenticator.create({ data: authenticator }),
      ]);

      return { success: true };
    }),

  rename: passkeyProcedure
    .input(z.object({ id: z.string(), label: labelSchema }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.db.authenticator.updateMany({
        where: { userId: ctx.session.user.id, credentialID: input.id },
        data: { label: input.label },
      });
      if (count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Passkey not found",
        });
      }
      return { success: true };
    }),

  delete: passkeyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [deleted] = await ctx.db.$transaction([
        ctx.db.authenticator.deleteMany({
          where: { userId, credentialID: input.id },
        }),
        ctx.db.account.deleteMany({
          where: {
            userId,
            provider: PASSKEY_PROVIDER_ID,
            providerAccountId: input.id,
          },
        }),
      ]);
      if (deleted.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Passkey not found",
        });
      }
      return { success: true };
    }),
});
