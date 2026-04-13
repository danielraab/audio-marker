import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { requireAdmin } from "./utils";

export const legalInformationRouter = createTRPCRouter({
  // Get all legal information entries
  getAllLegalInfo: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);
    return ctx.db.legalInformation.findMany({
      orderBy: {
        sortOrder: "asc",
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  // Get all enabled legal information entries (public)
  getAllEnabledLegalInfo: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.legalInformation.findMany({
      where: {
        enabled: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        label: true,
        content: true,
        updatedAt: true,
      },
    });
  }),

  // Create a new legal information entry (admin only)
  createLegalInfo: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1, "Label is required"),
        content: z.string().min(1, "Content is required"),
        enabled: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.db.legalInformation.create({
        data: {
          label: input.label,
          content: input.content,
          enabled: input.enabled,
          updatedById: ctx.session.user.id,
        },
      });
    }),

  // Update a legal information entry (admin only)
  updateLegalInfo: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Label is required").optional(),
        content: z.string().min(1, "Content is required").optional(),
        enabled: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const { id, ...data } = input;

      return ctx.db.legalInformation.update({
        where: { id },
        data: {
          ...data,
          updatedById: ctx.session.user.id,
        },
      });
    }),

  // Update sort order for multiple items (admin only)
  updateSortOrder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            sortOrder: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      // Update all items in a transaction
      await ctx.db.$transaction(
        input.items.map((item) =>
          ctx.db.legalInformation.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          }),
        ),
      );

      return { success: true };
    }),

  // Delete a legal information entry (admin only)
  deleteLegalInfo: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      return ctx.db.legalInformation.delete({
        where: { id: input.id },
      });
    }),
});
