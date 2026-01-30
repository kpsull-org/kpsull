import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { GetSubscriptionUseCase } from '@/modules/subscriptions/application/use-cases/get-subscription.use-case';
import { MockSubscriptionRepository } from '@/modules/subscriptions/infrastructure/repositories/mock-subscription.repository';
import { SubscriptionContent } from './subscription-content';

// Use mock repository for development
const subscriptionRepository = new MockSubscriptionRepository();
const getSubscriptionUseCase = new GetSubscriptionUseCase(subscriptionRepository);

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // For development, create a subscription if user doesn't have one
  const hasSubscription = await subscriptionRepository.existsByUserId(session.user.id);
  if (!hasSubscription) {
    subscriptionRepository.createForUser(
      session.user.id,
      `creator-${session.user.id}`,
      'ESSENTIEL'
    );
  }

  const result = await getSubscriptionUseCase.execute({
    userId: session.user.id,
  });

  if (result.isFailure) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">Erreur: {result.error}</p>
        </div>
      </div>
    );
  }

  return <SubscriptionContent subscription={result.value!} />;
}
