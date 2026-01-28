'use server';

import { auth } from '@/lib/auth/auth';
import { StripeBillingService } from '@/modules/subscriptions/infrastructure/services/stripe-billing.service';

interface CreateCheckoutSessionResult {
  url?: string;
  error?: string;
}

export async function createCheckoutSession(): Promise<CreateCheckoutSessionResult> {
  const session = await auth();

  if (!session?.user) {
    return { error: 'Vous devez être connecté' };
  }

  const userId = session.user.id;
  const email = session.user.email;

  if (!email) {
    return { error: 'Email requis' };
  }

  // TODO: Get creatorId from user profile
  // For now, we use userId as creatorId for demo purposes
  const creatorId = userId;

  const billingService = new StripeBillingService();

  const result = await billingService.createCheckoutSession({
    customerId: null, // Will be created by Stripe
    email,
    userId,
    creatorId,
  });

  if (result.isFailure) {
    return { error: result.error };
  }

  return { url: result.value!.url };
}
