import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { requireAdmin } from "./utils";
import { revalidateTag } from "next/cache";
import { after } from "next/server";

export const HEAD_INJECTION_KEY = "headInjection";
export const HEAD_INJECTION_CACHE_TAG = "system-setting-head-injection";

export const systemSettingsRouter = createTRPCRouter({
  getRegistrationStatus: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    return {
      registrationEnabled: env.MAIL_REGISTRATION_ENABLED,
    };
  }),

  getHeadInjection: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    const setting = await ctx.db.systemSetting.findUnique({
      where: { key: HEAD_INJECTION_KEY },
    });

    return { value: setting?.value ?? "" };
  }),

  setHeadInjection: protectedProcedure
    .input(z.object({ value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      await ctx.db.systemSetting.upsert({
        where: { key: HEAD_INJECTION_KEY },
        create: { key: HEAD_INJECTION_KEY, value: input.value },
        update: { value: input.value },
      });

      after(() => revalidateTag(HEAD_INJECTION_CACHE_TAG));

      return { success: true };
    }),
});