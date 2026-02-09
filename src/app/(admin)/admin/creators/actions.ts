'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaCreatorRepository } from '@/modules/analytics/infrastructure/repositories/prisma-creator.repository';
import { SuspendCreatorUseCase } from '@/modules/analytics/application/use-cases/suspend-creator.use-case';
import { ReactivateCreatorUseCase } from '@/modules/analytics/application/use-cases/reactivate-creator.use-case';

function getRepository() {
  return new PrismaCreatorRepository(prisma);
}

export async function suspendCreatorAction(
  creatorId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Non autorise' };
  }

  const useCase = new SuspendCreatorUseCase(getRepository());
  const result = await useCase.execute({
    creatorId,
    adminId: session.user.id!,
    reason,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

export async function reactivateCreatorAction(
  creatorId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Non autorise' };
  }

  const useCase = new ReactivateCreatorUseCase(getRepository());
  const result = await useCase.execute({
    creatorId,
    adminId: session.user.id!,
    reason,
  });

  if (result.isFailure) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
