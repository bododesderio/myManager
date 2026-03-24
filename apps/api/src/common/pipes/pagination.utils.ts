/**
 * Clamps pagination parameters to safe, bounded values.
 *
 * - page: minimum 1
 * - limit: between 1 and maxLimit (default 100)
 */
export function clampPagination(
  page: number,
  limit: number,
  maxLimit = 100,
): { page: number; limit: number } {
  return {
    page: Math.max(1, Math.floor(page)),
    limit: Math.min(Math.max(1, Math.floor(limit)), maxLimit),
  };
}
