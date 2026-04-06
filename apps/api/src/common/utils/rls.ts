import { PrismaClient } from '@prisma/client';

/**
 * Sets the workspace context for the current database transaction.
 *
 * Must be called inside a Prisma interactive transaction (`prisma.$transaction`)
 * BEFORE any queries that touch workspace-scoped tables. The `SET LOCAL` ensures
 * the setting is automatically cleared when the transaction ends.
 *
 * @example
 * ```ts
 * await prisma.$transaction(async (tx) => {
 *   await setWorkspaceContext(tx, workspaceId);
 *   const posts = await tx.post.findMany();
 *   // posts are automatically filtered to workspaceId by RLS
 * });
 * ```
 */
export async function setWorkspaceContext(
  prisma: PrismaClient,
  workspaceId: string,
): Promise<void> {
  // Validate UUID format to prevent SQL injection
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      workspaceId,
    )
  ) {
    throw new Error('Invalid workspace ID format');
  }
  await prisma.$executeRawUnsafe(
    `SET LOCAL app.current_workspace_id = '${workspaceId}'`,
  );
}

/**
 * Clears the workspace context for the current session.
 * Useful for background jobs or admin operations that need to
 * operate across workspaces (when running as the table owner).
 */
export async function clearWorkspaceContext(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `RESET app.current_workspace_id`,
  );
}
