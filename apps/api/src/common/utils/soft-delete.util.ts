/**
 * Merges `deletedAt: null` into Prisma where clauses unless includeDeleted is set.
 */
export function withNotDeleted<T extends Record<string, unknown>>(
  where: T = {} as T,
  includeDeleted = false,
): T & { deletedAt?: null } {
  if (includeDeleted) {
    return where;
  }
  return { ...where, deletedAt: null };
}
