import { audioRouter } from "./routers/audio";
import { markerRouter } from "./routers/marker";
import { playlistRouter } from "./routers/playlist";
import { adminRouter } from "./routers/admin";
import { passkeyRouter } from "./routers/passkey";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  audio: audioRouter,
  marker: markerRouter,
  playlist: playlistRouter,
  admin: adminRouter,
  passkey: passkeyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
