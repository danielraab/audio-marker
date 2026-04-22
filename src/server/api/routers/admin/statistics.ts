import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireAdmin } from "./utils";

export const statisticsRouter = createTRPCRouter({
  getOverallStatistics: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session);

    // Get counts in parallel
    const [
      totalUsers,
      totalAudios,
      totalPlaylists,
      totalListens,
      totalPlaylistListens,
      activeAudios,
      activePlaylists,
      deletedAudios,
      deletedPlaylists,
      publicAudios,
      publicPlaylists,
      recentListens,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.audio.count(),
      ctx.db.playlist.count(),
      ctx.db.audioListenRecord.count(),
      ctx.db.playlistListenRecord.count(),
      ctx.db.audio.count({ where: { deletedAt: null } }),
      ctx.db.playlist.count({ where: { deletedAt: null } }),
      ctx.db.audio.count({ where: { deletedAt: { not: null } } }),
      ctx.db.playlist.count({ where: { deletedAt: { not: null } } }),
      ctx.db.audio.count({ where: { deletedAt: null, isPublic: true } }),
      ctx.db.playlist.count({ where: { deletedAt: null, isPublic: true } }),
      // Recent listens in last 7 days
      ctx.db.audioListenRecord.count({
        where: {
          listenedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get top listened audios with creator info
    const topAudios = await ctx.db.audio.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: { listenRecords: true },
        },
      },
      orderBy: {
        listenRecords: { _count: "desc" },
      },
      take: 5,
    });

    return {
      users: {
        total: totalUsers,
      },
      audios: {
        total: totalAudios,
        active: activeAudios,
        deleted: deletedAudios,
        public: publicAudios,
      },
      playlists: {
        total: totalPlaylists,
        active: activePlaylists,
        deleted: deletedPlaylists,
        public: publicPlaylists,
      },
      listens: {
        totalAudioListens: totalListens,
        totalPlaylistListens: totalPlaylistListens,
        recentAudioListens: recentListens,
      },
      topAudios: topAudios.map((audio) => ({
        id: audio.id,
        name: audio.name,
        listens: audio._count.listenRecords,
        createdBy: audio.createdBy,
      })),
    };
  }),

  getInactiveAudios: protectedProcedure
    .input(z.object({ daysInactive: z.number().min(1).default(30) }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const cutoffDate = new Date(
        Date.now() - input.daysInactive * 24 * 60 * 60 * 1000,
      );

      // Get audios that have not been listened to in the specified time range
      // This includes audios with no listens OR audios whose last listen was before cutoff
      const inactiveAudios = await ctx.db.audio.findMany({
        where: {
          deletedAt: null,
          OR: [
            // Audios with no listen records at all
            { listenRecords: { none: {} } },
            // Audios whose most recent listen is before the cutoff date
            {
              listenRecords: {
                every: {
                  listenedAt: { lt: cutoffDate },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          originalFileName: true,
          createdAt: true,
          isPublic: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          listenRecords: {
            orderBy: { listenedAt: "desc" },
            take: 1,
            select: { listenedAt: true },
          },
          _count: {
            select: { listenRecords: true },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      console.log(
        `Found ${inactiveAudios.length} inactive audios (no listens or last listen before ${cutoffDate.toISOString()})`,
      );

      return inactiveAudios.map((audio) => ({
        id: audio.id,
        name: audio.name,
        originalFileName: audio.originalFileName,
        createdAt: audio.createdAt,
        isPublic: audio.isPublic,
        createdBy: audio.createdBy,
        totalListens: audio._count.listenRecords,
        lastListenedAt: audio.listenRecords[0]?.listenedAt ?? null,
      }));
    }),

  softDeleteAudio: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const audio = await ctx.db.audio.findUnique({
        where: { id: input.id },
        select: { id: true, deletedAt: true },
      });

      if (!audio) {
        throw new Error("Audio not found");
      }

      if (audio.deletedAt) {
        throw new Error("Audio is already deleted");
      }

      await ctx.db.audio.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true, id: input.id };
    }),

  getListenTrends: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session);

      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const [audioListens, playlistListens] = await Promise.all([
        ctx.db.audioListenRecord.findMany({
          where: { listenedAt: { gte: startDate } },
          select: { listenedAt: true },
          orderBy: { listenedAt: "asc" },
        }),
        ctx.db.playlistListenRecord.findMany({
          where: { listenedAt: { gte: startDate } },
          select: { listenedAt: true },
          orderBy: { listenedAt: "asc" },
        }),
      ]);

      // Build a map with all dates in the range initialized to 0
      const dateMap = new Map<
        string,
        { date: string; audioListens: number; playlistListens: number }
      >();
      for (let i = 0; i < input.days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().substring(0, 10);
        dateMap.set(dateStr, {
          date: dateStr,
          audioListens: 0,
          playlistListens: 0,
        });
      }

      for (const listen of audioListens) {
        const dateStr = listen.listenedAt.toISOString().substring(0, 10);
        const entry = dateMap.get(dateStr);
        if (entry) entry.audioListens++;
      }

      for (const listen of playlistListens) {
        const dateStr = listen.listenedAt.toISOString().substring(0, 10);
        const entry = dateMap.get(dateStr);
        if (entry) entry.playlistListens++;
      }

      return Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
    }),
});
