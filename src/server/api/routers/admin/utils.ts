import { TRPCError } from "@trpc/server";

interface SessionWithUser {
  user: { isAdmin: boolean };
}

/**
 * Checks if the current user is an admin
 * Throws FORBIDDEN error if not admin
 */
export function requireAdmin(session: SessionWithUser) {
  if (!session.user.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can access this resource",
    });
  }
}

/**
 * Checks if the current user is an admin for user management operations
 * Throws FORBIDDEN error if not admin
 */
export function requireAdminForUserManagement(
  session: SessionWithUser,
  operation: string,
) {
  if (!session.user.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Only admins can ${operation}`,
    });
  }
}
