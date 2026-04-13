import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

/**
 * Checks if the current user is an admin
 * Throws FORBIDDEN error if not admin
 */
export function requireAdmin(session: Session) {
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
  session: Session,
  operation: string,
) {
  if (!session.user.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Only admins can ${operation}`,
    });
  }
}
