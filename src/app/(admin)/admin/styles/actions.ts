'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { revalidatePath } from 'next/cache';
import { StyleStatus } from '@prisma/client';
import { ResendEmailService } from '@/modules/notifications/infrastructure/services/resend-email.service';
import { SendEmailNotificationUseCase } from '@/modules/notifications/application/use-cases/send-email-notification.use-case';

function getEmailService() {
  try {
    return new ResendEmailService();
  } catch {
    // RESEND_API_KEY not set (local dev) — skip email silently
    return null;
  }
}

export interface StyleWithCreator {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  creatorId: string | null;
  status: StyleStatus;
  rejectionReason: string | null;
  createdAt: Date;
  creator: {
    name: string | null;
    email: string;
  } | null;
}

export interface PaginatedStyles {
  items: StyleWithCreator[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

async function requireAdmin(): Promise<{ success: false; error: string } | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false as const, error: 'Non autorisé' };
  }
  return null;
}

export async function listPendingStylesAction(): Promise<
  | { success: false; error: string }
  | { success: true; data: StyleWithCreator[] }
> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const styles = await prisma.style.findMany({
    where: { status: StyleStatus.PENDING_APPROVAL },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      creatorId: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const creatorIds = [
    ...new Set(styles.map((s) => s.creatorId).filter((id): id is string => id !== null)),
  ];

  const users =
    creatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const data: StyleWithCreator[] = styles.map((style) => ({
    ...style,
    creator: style.creatorId ? (userMap.get(style.creatorId) ?? null) : null,
  }));

  return { success: true as const, data };
}

export async function approveStyleAction(
  styleId: string
): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const style = await prisma.style.update({
    where: { id: styleId },
    data: { status: StyleStatus.APPROVED, rejectionReason: null },
    select: { name: true, creatorId: true },
  });

  // Notify creator by email (fire-and-forget, non-blocking)
  if (style.creatorId) {
    const creator = await prisma.user.findUnique({
      where: { id: style.creatorId },
      select: { email: true },
    });
    if (creator?.email) {
      const emailService = getEmailService();
      if (emailService) {
        const useCase = new SendEmailNotificationUseCase(emailService);
        useCase.execute({
          to: creator.email,
          type: 'STYLE_APPROVED',
          data: { styleName: style.name },
        }).catch((err: unknown) => console.error('[Style] Notification approve failed:', err));
      }
    }
  }

  revalidatePath('/admin/styles');
  return { success: true };
}

export async function rejectStyleAction(
  styleId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAdmin();
  if (authError) return authError;

  if (!reason.trim()) {
    return { success: false, error: 'Le motif de rejet est obligatoire' };
  }

  const trimmedReason = reason.trim();

  const style = await prisma.style.update({
    where: { id: styleId },
    data: { status: StyleStatus.REJECTED, rejectionReason: trimmedReason },
    select: { name: true, creatorId: true },
  });

  // Notify creator by email (fire-and-forget, non-blocking)
  if (style.creatorId) {
    const creator = await prisma.user.findUnique({
      where: { id: style.creatorId },
      select: { email: true },
    });
    if (creator?.email) {
      const emailService = getEmailService();
      if (emailService) {
        const useCase = new SendEmailNotificationUseCase(emailService);
        useCase.execute({
          to: creator.email,
          type: 'STYLE_REJECTED',
          data: { styleName: style.name, reason: trimmedReason },
        }).catch((err: unknown) => console.error('[Style] Notification reject failed:', err));
      }
    }
  }

  revalidatePath('/admin/styles');
  return { success: true };
}

export async function listAllStylesAction(params?: {
  status?: StyleStatus;
  page?: number;
  pageSize?: number;
}): Promise<
  | { success: false; error: string }
  | { success: true; data: PaginatedStyles }
> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const page = Math.max(1, params?.page ?? 1);
  const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where = params?.status ? { status: params.status } : {};

  const [total, styles] = await Promise.all([
    prisma.style.count({ where }),
    prisma.style.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        creatorId: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  const creatorIds = [
    ...new Set(styles.map((s) => s.creatorId).filter((id): id is string => id !== null)),
  ];

  const users =
    creatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  const items: StyleWithCreator[] = styles.map((style) => ({
    ...style,
    creator: style.creatorId ? (userMap.get(style.creatorId) ?? null) : null,
  }));

  return {
    success: true as const,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
