'use server';

import { auth } from '@/lib/auth';
import { PrismaModerationRepository } from '@/modules/moderation/infrastructure/repositories/prisma-moderation.repository';
import { ListFlaggedContentUseCase } from '@/modules/moderation/application/use-cases/list-flagged-content.use-case';
import { ModerateContentUseCase } from '@/modules/moderation/application/use-cases/moderate-content.use-case';
import { ListModerationActionsUseCase } from '@/modules/moderation/application/use-cases/list-moderation-actions.use-case';
import { prisma } from '@/lib/prisma/client';
import type { ModerationStatusValue } from '@/modules/moderation/domain/value-objects/moderation-status.vo';
import type { ModerationActionValue } from '@/modules/moderation/domain/value-objects/moderation-action.vo';

function getRepository() {
  return new PrismaModerationRepository(prisma);
}

export async function listFlaggedContentAction(params: {
  status?: ModerationStatusValue;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false as const, error: 'Non autorise' };
  }

  const useCase = new ListFlaggedContentUseCase(getRepository());
  const result = await useCase.execute(params);

  if (result.isFailure) {
    return { success: false as const, error: result.error };
  }

  // Serialize dates for client transport
  const data = result.value!;
  return {
    success: true as const,
    data: {
      ...data,
      items: data.items.map((item) => item.toJSON()),
    },
  };
}

export async function moderateContentAction(params: {
  flaggedContentId: string;
  action: ModerationActionValue;
  note?: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false as const, error: 'Non autorise' };
  }

  const useCase = new ModerateContentUseCase(getRepository());
  const result = await useCase.execute({
    flaggedContentId: params.flaggedContentId,
    action: params.action,
    moderatorId: session.user.id!,
    moderatorName: session.user.name ?? 'Admin',
    moderatorEmail: session.user.email ?? '',
    note: params.note,
  });

  if (result.isFailure) {
    return { success: false as const, error: result.error };
  }

  return { success: true as const };
}

export async function listModerationActionsAction(params: {
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false as const, error: 'Non autorise' };
  }

  const useCase = new ListModerationActionsUseCase(getRepository());
  const result = await useCase.execute(params);

  if (result.isFailure) {
    return { success: false as const, error: result.error };
  }

  // Serialize dates for client transport
  const data = result.value!;
  return {
    success: true as const,
    data: {
      ...data,
      items: data.items.map((item) => item.toJSON()),
    },
  };
}
