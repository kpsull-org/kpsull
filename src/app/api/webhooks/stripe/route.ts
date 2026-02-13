'use server';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { stripe } from '@/lib/stripe/client';
import { PrismaCreatorOnboardingRepository } from '@/modules/creators/infrastructure/repositories/prisma-creator-onboarding.repository';

const creatorOnboardingRepository = new PrismaCreatorOnboardingRepository();

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events, particularly account.updated
 * to mark creator onboarding as complete when Stripe Connect is ready.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    Sentry.captureException(err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      await handleAccountUpdated(account);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Handle account.updated event
 *
 * When a Stripe Connect account is fully onboarded
 * (charges_enabled, payouts_enabled, details_submitted),
 * mark the creator onboarding as complete.
 */
async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  const isFullyOnboarded =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted;

  if (!isFullyOnboarded) {
    return;
  }

  try {
    // Find onboarding by Stripe account ID
    const onboarding = await creatorOnboardingRepository.findByStripeAccountId(
      account.id
    );

    if (!onboarding) {
      return;
    }

    // Complete Stripe onboarding
    const result = onboarding.completeStripeOnboarding(account.id);

    if (result.isFailure) {
      console.error(
        `Failed to complete Stripe onboarding: ${result.error}`
      );
      return;
    }

    // Save the updated onboarding
    await creatorOnboardingRepository.save(onboarding);

  } catch (error) {
    console.error('Error handling account.updated:', error);
    Sentry.captureException(error);
  }
}
