'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';

export async function completeDashboardTour(): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  await prisma.creatorOnboarding.updateMany({
    where: { userId: session.user.id },
    data: { dashboardTourCompleted: true },
  });

  return { success: true };
}
