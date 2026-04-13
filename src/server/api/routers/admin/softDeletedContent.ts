import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireAdmin } from "./utils";

export const softDeletedContentRouter = createTRPCRouter({
  getSoftDeletedAudios: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    requireAdmin(ctx.session);

    return ctx.db.audio.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true,
        name: true,
        originalFileName: true,
        filePath: true,
        deletedAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { deletedAt: "desc" },
    });
  }),

  getSoftDeletedPlaylists: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    requireAdmin(ctx.session);

    return ctx.db.playlist.findMany({
      where: { deletedAt: { not: null } },
      include: { createdBy: true },
      orderBy: { deletedAt: "desc" },
    });
  }),

  recoverAudio: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdmin(ctx.session);

      return ctx.db.audio.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),

  recoverPlaylist: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdmin(ctx.session);

      return ctx.db.playlist.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),

  permanentlyDeleteAudio: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdmin(ctx.session);

      // First get the audio record to retrieve the file path
      const audio = await ctx.db.audio.findUnique({
        where: { id: input.id },
        select: { filePath: true },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      try {
        // Delete the physical file from the file system
        const { unlink } = await import("fs/promises");
        const path = await import("path");

        // Convert the database filePath (e.g., "/uploads/filename.mp3") to absolute path
        const absolutePath = path.join(process.cwd(), "public", audio.filePath);
        await unlink(absolutePath);
      } catch (fileError) {
        // Log the error but don't throw - we still want to delete the database record
        // even if the file doesn't exist or can't be deleted
        console.error(
          `Failed to delete audio file: ${audio.filePath}`,
          fileError,
        );
      }

      // Delete the database record
      return ctx.db.audio.delete({
        where: { id: input.id },
      });
    }),

  permanentlyDeletePlaylist: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdmin(ctx.session);

      return ctx.db.playlist.delete({
        where: { id: input.id },
      });
    }),
});
