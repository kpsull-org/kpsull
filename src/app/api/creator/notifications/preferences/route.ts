import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaNotificationPreferenceRepository } from '@/modules/notifications/infrastructure/repositories/prisma-notification-preference.repository';
import { GetNotificationPreferencesUseCase } from '@/modules/notifications/application/use-cases/get-notification-preferences.use-case';
import { UpdateNotificationPreferenceUseCase } from '@/modules/notifications/application/use-cases/update-notification-preference.use-case';
import type { NotificationTypeValue } from '@/modules/notifications/domain/value-objects/notification-type.vo';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  }

  const repository = new PrismaNotificationPreferenceRepository(prisma);
  const useCase = new GetNotificationPreferencesUseCase(repository);
  const result = await useCase.execute(session.user.id);

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ preferences: result.value });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  }

  const body = await request.json() as { type: string; email: boolean; inApp: boolean };

  if (!body.type || typeof body.email !== 'boolean' || typeof body.inApp !== 'boolean') {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
  }

  const repository = new PrismaNotificationPreferenceRepository(prisma);
  const useCase = new UpdateNotificationPreferenceUseCase(repository);
  const result = await useCase.execute({
    userId: session.user.id,
    type: body.type as NotificationTypeValue,
    email: body.email,
    inApp: body.inApp,
  });

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
