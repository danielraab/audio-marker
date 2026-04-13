import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { requireAdminForUserManagement } from "./utils";

export const userManagementRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    requireAdminForUserManagement(ctx.session, "access this resource");

    // Fetch all users with their account information
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        isAdmin: true,
        isDisabled: true,
        image: true,
        _count: {
          select: {
            audios: true,
            playlists: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    return users;
  }),

  createUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        isAdmin: z.boolean().default(false),
        isDisabled: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdminForUserManagement(ctx.session, "create users");

      // Check if email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Create the user
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          isAdmin: input.isAdmin,
          isDisabled: input.isDisabled,
        },
      });

      return user;
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Invalid email address").optional(),
        isAdmin: z.boolean().optional(),
        isDisabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdminForUserManagement(ctx.session, "update users");

      const { id, ...updateData } = input;

      // Check if user exists
      const existingUser = await ctx.db.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // If email is being changed, check if new email already exists
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await ctx.db.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A user with this email already exists",
          });
        }
      }

      // Prevent user from removing their own admin status
      if (
        updateData.isAdmin === false &&
        existingUser.id === ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove your own admin status",
        });
      }

      // Update the user
      const user = await ctx.db.user.update({
        where: { id },
        data: updateData,
      });

      return user;
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      requireAdminForUserManagement(ctx.session, "delete users");

      // Prevent user from deleting themselves
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        });
      }

      // Check if user exists
      const existingUser = await ctx.db.user.findUnique({
        where: { id: input.id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Delete the user (cascade will handle related records)
      await ctx.db.user.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
