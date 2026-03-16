import { prisma } from '@/lib/prisma/client';

/**
 * Returns the list of creator IDs that are currently suspended (no reactivatedAt).
 * Used to filter out suspended creators from public-facing queries.
 */
export async function getSuspendedCreatorIds(): Promise<string[]> {
  const suspensions = await prisma.creatorSuspension.findMany({
    where: { reactivatedAt: null },
    select: { creatorId: true },
    distinct: ['creatorId'],
  });
  return suspensions.map((s) => s.creatorId);
}
