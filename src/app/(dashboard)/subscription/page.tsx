import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { GetSubscriptionUseCase } from '@/modules/subscriptions/application/use-cases/get-subscription.use-case';
import { PrismaSubscriptionRepository } from '@/modules/subscriptions/infrastructure/repositories/prisma-subscription.repository';
import { SubscriptionContent } from './subscription-content';

const subscriptionRepository = new PrismaSubscriptionRepository();
const getSubscriptionUseCase = new GetSubscriptionUseCase(subscriptionRepository);

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const result = await getSubscriptionUseCase.execute({
    userId: session.user.id,
  });

  if (result.isFailure) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <p className="text-destructive">Erreur: {result.error}</p>
      </div>
    );
  }

  return <SubscriptionContent subscription={result.value!} />;
}
