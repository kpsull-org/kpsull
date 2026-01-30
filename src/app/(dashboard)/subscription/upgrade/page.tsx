import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { UpgradeContent } from './upgrade-content';
import { GetSubscriptionUseCase } from '@/modules/subscriptions/application';
import { MockSubscriptionRepository } from '@/modules/subscriptions/infrastructure/repositories/mock-subscription.repository';

export const metadata = {
  title: 'Upgrade vers PRO | Kpsull',
  description: 'Passez au plan PRO pour des fonctionnalités illimitées',
};

export default async function UpgradePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user's current subscription
  // TODO: Replace with real repository when database is ready
  const subscriptionRepo = new MockSubscriptionRepository();
  const getSubscriptionUseCase = new GetSubscriptionUseCase(subscriptionRepo);

  const subscriptionResult = await getSubscriptionUseCase.execute({
    userId: session.user.id,
  });

  // If no subscription found, user might not be a creator
  if (subscriptionResult.isFailure) {
    redirect('/dashboard');
  }

  const subscription = subscriptionResult.value!;

  return (
    <div className="container max-w-5xl py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Choisissez votre plan
          </h1>
          <p className="text-muted-foreground mt-2">
            Débloquez tout le potentiel de Kpsull avec le plan PRO
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
