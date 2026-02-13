import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaNotificationPreferenceRepository } from '@/modules/notifications/infrastructure/repositories/prisma-notification-preference.repository';
import { GetNotificationPreferencesUseCase } from '@/modules/notifications/application/use-cases/get-notification-preferences.use-case';
import { NotificationPreferencesClient } from './page-client';

export const metadata: Metadata = {
  title: 'Preferences de notification | Kpsull',
  description: 'Configurez vos preferences de notification',
};

export default async function NotificationPreferencesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'CREATOR' && session.user.role !== 'ADMIN') {
    redirect('/profile');
  }

  const repository = new PrismaNotificationPreferenceRepository(prisma);
  const useCase = new GetNotificationPreferencesUseCase(repository);
  const result = await useCase.execute(session.user.id);

  if (result.isFailure) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Preferences de notification</h1>
        <p className="text-muted-foreground">
          Une erreur est survenue lors du chargement de vos preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Preferences de notification</h1>
        <p className="text-muted-foreground mt-1">
          Configurez comment vous souhaitez etre notifie pour chaque type d&apos;evenement.
        </p>
      </div>
      <NotificationPreferencesClient preferences={result.value} />
    </div>
  );
}
