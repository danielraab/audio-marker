import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const audioRouter = createTRPCRouter({
  getUserAudios: protectedProcedure.query(async ({ ctx }) => {
    const audios = await ctx.db.audio.findMany({
      where: {
        createdById: ctx.session.user.id,
        deletedAt: null, // Only fetch non-deleted audios
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        originalFileName: true,
        filePath: true,
        createdAt: true,
        isPublic: true,
        listenRecords: {
          orderBy: { listenedAt: "desc" },
          take: 1,
          select: { listenedAt: true },
        },
        _count: {
          select: {
            markers: true,
            listenRecords: true,
          },
        },
      },
    });

    // Transform the result to include markerCount, listenCounter, and lastListenAt
    const audiosWithMarkerCount = audios.map((audio) => ({
      ...audio,
      markerCount: audio._count.markers,
      listenCounter: audio._count.listenRecords,
      lastListenAt: audio.listenRecords[0]?.listenedAt ?? null,
      listenRecords: undefined,
      _count: undefined, // Remove the _count object
    }));

    return audiosWithMarkerCount;
  }),

  getUserAudioById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const audio = await ctx.db.audio.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          originalFileName: true,
          filePath: true,
          createdAt: true,
          updatedAt: true,
          isPublic: true,
          createdById: true,
        },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      return audio;
    }),

  getPublicAudioById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const audio = await ctx.db.audio.findFirst({
        where: {
          id: input.id,
          isPublic: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          originalFileName: true,
          filePath: true,
          createdAt: true,
          isPublic: true,
          createdById: true,
        },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      return audio;
    }),

  deleteAudio: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First check if the audio belongs to the user and is not already deleted
      const audio = await ctx.db.audio.findUnique({
        where: { id: input.id },
        select: { createdById: true, filePath: true, deletedAt: true },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      if (audio.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      if (audio.deletedAt) {
        throw new Error("Audio already deleted");
      }

      // Perform soft delete by setting deletedAt timestamp
      await ctx.db.audio.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  updateAudio: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z
          .string()
          .min(1, "Name is required")
          .max(100, "Name is too long"),
        description: z.string().max(500, "Description is too long").optional(),
        isPublic: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const audio = await ctx.db.audio.findUnique({
        where: { id: input.id },
        select: { createdById: true },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      if (audio.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const updatedAudio = await ctx.db.audio.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        },
        select: {
          id: true,
          name: true,
          originalFileName: true,
          createdAt: true,
        },
      });

      return updatedAudio;
    }),

  incrementListenCount: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const audio = await ctx.db.audio.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          isPublic: true,
          deletedAt: true,
          createdById: true,
        },
      });

      if (!audio || audio.deletedAt) {
        throw new Error("Audio not found");
      }

      // Check if user has access (public or owner)
      const hasAccess =
        audio.isPublic || ctx.session?.user?.id === audio.createdById;
      if (!hasAccess) {
        throw new Error("Unauthorized");
      }

      // Create a listen record
      await ctx.db.audioListenRecord.create({
        data: {
          audioId: input.id,
          listenedAt: new Date(),
        },
      });

      return { success: true };
    }),

  getListenStatistics: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        days: z.number().min(7).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify user owns this audio
      const audio = await ctx.db.audio.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      // Get the date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);

      // Fetch all listen records within the date range
      const listenRecords = await ctx.db.audioListenRecord.findMany({
        where: {
          audioId: input.id,
          listenedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          listenedAt: true,
        },
        orderBy: {
          listenedAt: "asc",
        },
      });

      // Get total listen count
      const totalListens = await ctx.db.audioListenRecord.count({
        where: { audioId: input.id },
      });

      // Group by date
      const dailyStats: Record<string, number> = {};

      // Initialize all dates in range with 0
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().substring(0, 10);
        dailyStats[dateKey] = 0;
      }

      // Count listens per day
      for (const record of listenRecords) {
        const dateKey = record.listenedAt.toISOString().substring(0, 10);
        if (dailyStats[dateKey] !== undefined) {
          dailyStats[dateKey]++;
        }
      }

      // Convert to array format for chart
      const chartData = Object.entries(dailyStats).map(([date, count]) => ({
        date,
        listens: count,
      }));

      return {
        audioName: audio.name,
        audioCreatedAt: audio.createdAt,
        totalListens,
        periodListens: listenRecords.length,
        dailyStats: chartData,
      };
    }),
});
