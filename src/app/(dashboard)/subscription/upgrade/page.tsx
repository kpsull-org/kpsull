import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { UpgradeContent } from './upgrade-content';
import { GetSubscriptionUseCase } from '@/modules/subscriptions/application';
import { PrismaSubscriptionRepository } from '@/modules/subscriptions/infrastructure/repositories/prisma-subscription.repository';

export const metadata = {
  title: 'Upgrade vers PRO | Kpsull',
  description: 'Passez au plan PRO pour des fonctionnalites illimitees',
};

export default async function UpgradePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  const subscriptionRepo = new PrismaSubscriptionRepository();
  const getSubscriptionUseCase = new GetSubscriptionUseCase(subscriptionRepo);

  const subscriptionResult = await getSubscriptionUseCase.execute({
    userId: session.user.id,
  });

  if (subscriptionResult.isFailure) {
    redirect('/dashboard');
  }

  const subscription = subscriptionResult.value!;

  return (
    <div className="max-w-5xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Choisissez votre plan
          </h1>
          <p className="text-muted-foreground mt-2">
            Debloquez tout le potentiel de Kpsull avec le plan PRO
          </p>
        </div>

        <UpgradeContent
          currentPlan={subscription.plan}
          userEmail={session.user.email || ''}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
