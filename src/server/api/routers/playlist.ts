import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const playlistRouter = createTRPCRouter({
  getUserPlaylists: protectedProcedure.query(async ({ ctx }) => {
    const playlists = await ctx.db.playlist.findMany({
      where: {
        createdById: ctx.session.user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        listenRecords: {
          orderBy: { listenedAt: "desc" },
          take: 1,
          select: { listenedAt: true },
        },
        _count: {
          select: {
            audios: {
              where: {
                audio: {
                  deletedAt: null,
                },
              },
            },
            listenRecords: true,
          },
        },
      },
    });

    // Transform the result to include audioCount, listenCounter, and lastListenAt
    const playlistsWithAudioCount = playlists.map((playlist) => ({
      ...playlist,
      audioCount: playlist._count.audios,
      listenCounter: playlist._count.listenRecords,
      lastListenAt: playlist.listenRecords[0]?.listenedAt ?? null,
      listenRecords: undefined,
      _count: undefined,
    }));

    return playlistsWithAudioCount;
  }),

  getUserPlaylistById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          audios: {
            orderBy: { order: "asc" },
            where: {
              audio: {
                deletedAt: null,
              },
            },
            select: {
              id: true,
              order: true,
              addedAt: true,
              audio: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  originalFileName: true,
                  filePath: true,
                  createdAt: true,
                  _count: {
                    select: {
                      markers: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Transform the result to include markerCount at the audio level
      const playlistWithMarkerCount = {
        ...playlist,
        audios: playlist.audios.map((playlistAudio) => ({
          ...playlistAudio,
          audio: {
            ...playlistAudio.audio,
            markerCount: playlistAudio.audio._count.markers,
            _count: undefined,
          },
        })),
      };

      return playlistWithMarkerCount;
    }),

  getPublicPlaylistById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: {
          id: input.id,
          isPublic: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          audios: {
            orderBy: { order: "asc" },
            where: {
              audio: {
                deletedAt: null,
              },
            },
            select: {
              id: true,
              order: true,
              addedAt: true,
              audio: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  isPublic: true,
                  originalFileName: true,
                  filePath: true,
                  createdAt: true,
                  deletedAt: true,
                  _count: {
                    select: {
                      markers: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Transform the result to include markerCount at the audio level
      const playlistWithMarkerCount = {
        ...playlist,
        audios: playlist.audios
          .filter((playlistAudio) => playlistAudio.audio.isPublic)
          .map((playlistAudio) => ({
            ...playlistAudio,
            audio: {
              ...playlistAudio.audio,
              markerCount: playlistAudio.audio._count.markers,
              _count: undefined,
            },
          })),
      };

      return playlistWithMarkerCount;
    }),

  createPlaylist: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Name is required")
          .max(100, "Name is too long"),
        description: z.string().max(500, "Description is too long").optional(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.create({
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          createdById: ctx.session.user.id,
        },
        select: {
          id: true,
          name: true,
          isPublic: true,
          createdAt: true,
        },
      });

      return playlist;
    }),

  updatePlaylist: protectedProcedure
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
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.id },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const updatedPlaylist = await ctx.db.playlist.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        },
        select: {
          id: true,
          name: true,
          isPublic: true,
          updatedAt: true,
        },
      });

      return updatedPlaylist;
    }),

  deletePlaylist: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.id },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Perform soft delete by setting deletedAt timestamp
      await ctx.db.playlist.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  addAudioToPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        audioId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if playlist exists and belongs to user
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Check if audio exists and belongs to user
      const audio = await ctx.db.audio.findUnique({
        where: { id: input.audioId },
        select: { createdById: true, deletedAt: true },
      });

      if (!audio || audio.deletedAt) {
        throw new Error("Audio not found");
      }

      if (audio.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Check if audio is already in playlist
      const existingPlaylistAudio = await ctx.db.playlistAudio.findUnique({
        where: {
          playlistId_audioId: {
            playlistId: input.playlistId,
            audioId: input.audioId,
          },
        },
      });

      if (existingPlaylistAudio) {
        throw new Error("Audio is already in this playlist");
      }

      // Get the next order number
      const lastPlaylistAudio = await ctx.db.playlistAudio.findFirst({
        where: { playlistId: input.playlistId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const nextOrder = (lastPlaylistAudio?.order ?? -1) + 1;

      // Add audio to playlist
      const playlistAudio = await ctx.db.playlistAudio.create({
        data: {
          playlistId: input.playlistId,
          audioId: input.audioId,
          order: nextOrder,
        },
        select: {
          id: true,
          order: true,
          addedAt: true,
          audio: {
            select: {
              id: true,
              name: true,
              description: true,
              originalFileName: true,
              filePath: true,
            },
          },
        },
      });

      return playlistAudio;
    }),

  removeAudioFromPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        audioId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if playlist exists and belongs to user
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Remove audio from playlist
      await ctx.db.playlistAudio.delete({
        where: {
          playlistId_audioId: {
            playlistId: input.playlistId,
            audioId: input.audioId,
          },
        },
      });

      return { success: true };
    }),

  reorderPlaylistAudios: protectedProcedure
    .input(
      z.object({
        playlistId: z.string(),
        audioOrders: z.array(
          z.object({
            audioId: z.string(),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if playlist exists and belongs to user
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Update the order of each audio in the playlist
      await Promise.all(
        input.audioOrders.map(({ audioId, order }) =>
          ctx.db.playlistAudio.update({
            where: {
              playlistId_audioId: {
                playlistId: input.playlistId,
                audioId: audioId,
              },
            },
            data: { order },
          }),
        ),
      );

      return { success: true };
    }),

  getAvailableAudiosForPlaylist: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if playlist exists and belongs to user
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Get all user's audios that are not in this playlist
      const availableAudios = await ctx.db.audio.findMany({
        where: {
          createdById: ctx.session.user.id,
          deletedAt: null,
          playlistAudios: {
            none: {
              playlistId: input.playlistId,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          originalFileName: true,
          filePath: true,
          createdAt: true,
          _count: {
            select: {
              markers: true,
            },
          },
        },
      });

      // Transform the result to include markerCount at the top level
      const audiosWithMarkerCount = availableAudios.map((audio) => ({
        ...audio,
        markerCount: audio._count.markers,
        _count: undefined,
      }));

      return audiosWithMarkerCount;
    }),

  getUserPlaylistsForAudio: protectedProcedure
    .input(z.object({ audioId: z.string() }))
    .query(async ({ ctx, input }) => {
      const playlists = await ctx.db.playlist.findMany({
        where: {
          createdById: ctx.session.user.id,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              audios: {
                where: {
                  audio: {
                    deletedAt: null,
                  },
                },
              },
            },
          },
          audios: {
            where: {
              audioId: input.audioId,
            },
            select: {
              audioId: true,
            },
          },
        },
      });

      // Transform the result to include audioCount and hasAudio at the top level
      const playlistsWithAudioInfo = playlists.map((playlist) => ({
        ...playlist,
        audioCount: playlist._count.audios,
        hasAudio: playlist.audios.length > 0,
        _count: undefined,
        audios: undefined,
      }));

      return playlistsWithAudioInfo;
    }),

  getUserAudiosForPlaylist: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if playlist exists and belongs to user
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.playlistId },
        select: { createdById: true, deletedAt: true },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      if (playlist.createdById !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      // Get all user's audios with information about whether they're in this playlist
      const allAudios = await ctx.db.audio.findMany({
        where: {
          createdById: ctx.session.user.id,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          originalFileName: true,
          filePath: true,
          createdAt: true,
          _count: {
            select: {
              markers: true,
            },
          },
          playlistAudios: {
            where: {
              playlistId: input.playlistId,
            },
            select: {
              id: true,
            },
          },
        },
      });

      // Transform the result to include markerCount and isInPlaylist at the top level
      const audiosWithPlaylistInfo = allAudios.map((audio) => ({
        ...audio,
        markerCount: audio._count.markers,
        isInPlaylist: audio.playlistAudios.length > 0,
        _count: undefined,
        playlistAudios: undefined,
      }));

      return audiosWithPlaylistInfo;
    }),

  incrementListenCount: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.playlist.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          isPublic: true,
          deletedAt: true,
          createdById: true,
        },
      });

      if (!playlist || playlist.deletedAt) {
        throw new Error("Playlist not found");
      }

      // Check if user has access (public or owner)
      const hasAccess =
        playlist.isPublic || ctx.session?.user?.id === playlist.createdById;
      if (!hasAccess) {
        throw new Error("Unauthorized");
      }

      // Create a listen record
      await ctx.db.playlistListenRecord.create({
        data: {
          playlistId: input.id,
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
      // Verify user owns this playlist
      const playlist = await ctx.db.playlist.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          audios: {
            where: {
              audio: {
                deletedAt: null,
              },
            },
            orderBy: { order: "asc" },
            select: {
              audio: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Get the date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);

      // Fetch all listen records within the date range
      const listenRecords = await ctx.db.playlistListenRecord.findMany({
        where: {
          playlistId: input.id,
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
      const totalListens = await ctx.db.playlistListenRecord.count({
        where: { playlistId: input.id },
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

      // Fetch listen statistics for all audios in the playlist
      const audioIds = playlist.audios.map((pa) => pa.audio.id);

      const audioListenRecords =
        audioIds.length > 0
          ? await ctx.db.audioListenRecord.findMany({
              where: {
                audioId: { in: audioIds },
                listenedAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              select: {
                audioId: true,
                listenedAt: true,
              },
            })
          : [];

      const audioTotalListens =
        audioIds.length > 0
          ? await ctx.db.audioListenRecord.groupBy({
              by: ["audioId"],
              where: { audioId: { in: audioIds } },
              _count: { id: true },
            })
          : [];

      const totalListensByAudio = new Map(
        audioTotalListens.map((r) => [r.audioId, r._count.id]),
      );

      // Group audio listen records by audioId and date
      const audioStatsMap = new Map<string, Record<string, number>>();
      for (const audioId of audioIds) {
        const daily: Record<string, number> = {};
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateKey = d.toISOString().substring(0, 10);
          daily[dateKey] = 0;
        }
        audioStatsMap.set(audioId, daily);
      }

      for (const record of audioListenRecords) {
        const dateKey = record.listenedAt.toISOString().substring(0, 10);
        const daily = audioStatsMap.get(record.audioId);
        if (daily?.[dateKey] !== undefined) {
          daily[dateKey]++;
        }
      }

      const audioStats = playlist.audios.map((pa) => {
        const daily = audioStatsMap.get(pa.audio.id) ?? {};
        const periodListens = audioListenRecords.filter(
          (r) => r.audioId === pa.audio.id,
        ).length;
        const dailyChart = Object.entries(daily).map(([date, count]) => ({
          date,
          listens: count,
        }));
        const maxListens = Math.max(0, ...dailyChart.map((d) => d.listens));
        const peakDay = dailyChart.find(
          (d) => d.listens === maxListens && maxListens > 0,
        );

        return {
          audioId: pa.audio.id,
          audioName: pa.audio.name,
          totalListens: totalListensByAudio.get(pa.audio.id) ?? 0,
          periodListens,
          avgPerDay:
            periodListens > 0
              ? Number((periodListens / input.days).toFixed(1))
              : 0,
          peakDay: peakDay
            ? { date: peakDay.date, listens: peakDay.listens }
            : null,
          dailyStats: dailyChart,
        };
      });

      return {
        playlistName: playlist.name,
        playlistCreatedAt: playlist.createdAt,
        totalListens,
        periodListens: listenRecords.length,
        dailyStats: chartData,
        audioStats,
      };
    }),
});
