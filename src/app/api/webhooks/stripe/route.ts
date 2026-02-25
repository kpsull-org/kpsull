import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma/client';
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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
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
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(invoice, event.id);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent, event.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
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

/**
 * Handle invoice.payment_succeeded event
 *
 * When a creator subscription invoice is paid, record a SUBSCRIPTION
 * platform transaction. Uses stripeEventId for idempotence.
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  eventId: string
): Promise<void> {
  try {
    // In Stripe API 2026+, subscription is accessed via parent.subscription_details
    const subscriptionRef = invoice.parent?.subscription_details?.subscription;
    const stripeSubscriptionId =
      typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;

    if (!stripeSubscriptionId) {
      console.warn('invoice.payment_succeeded: no subscription id on invoice', invoice.id);
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      console.warn(
        `invoice.payment_succeeded: no local subscription found for stripeSubscriptionId=${stripeSubscriptionId}`
      );
      return;
    }

    const now = new Date();
    const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    await prisma.platformTransaction.upsert({
      where: { stripeEventId: eventId },
      update: {},
      create: {
        type: 'SUBSCRIPTION',
        status: 'CAPTURED',
        amount: invoice.amount_paid,
        creatorId: subscription.userId,
        subscriptionId: subscription.id,
        stripeEventId: eventId,
        period,
      },
    });
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
    Sentry.captureException(error);
  }
}

/**
 * Handle payment_intent.succeeded event
 *
 * When a client pays a creator's order, compute the commission based on
 * the creator's subscription commissionRate and record a COMMISSION
 * platform transaction. Uses stripeEventId for idempotence.
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
): Promise<void> {
  try {
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!order) {
      console.warn(
        `payment_intent.succeeded: no order found for paymentIntentId=${paymentIntent.id}`
      );
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { creatorId: order.creatorId },
    });

    if (!subscription) {
      console.warn(
        `payment_intent.succeeded: no subscription found for creatorId=${order.creatorId}`
      );
      return;
    }

    const commissionAmount = Math.round(order.totalAmount * subscription.commissionRate);

    const now = new Date();
    const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    await prisma.platformTransaction.upsert({
      where: { stripeEventId: eventId },
      update: {},
      create: {
        type: 'COMMISSION',
        status: 'CAPTURED',
        amount: commissionAmount,
        creatorId: order.creatorId,
        orderId: order.id,
        stripeEventId: eventId,
        period,
      },
    });

    // Mettre à jour l'Order en PAID (idempotent via check status PENDING)
    if (order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });
    }
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    Sentry.captureException(error);
  }
}

/**
 * Handle customer.subscription.deleted event
 *
 * When a Stripe subscription is deleted, update the local
 * Subscription record status to CANCELED.
 */
async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      console.warn(
        `customer.subscription.deleted: no local subscription for stripeSubscriptionId=${stripeSubscription.id}`
      );
      return;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELED' },
    });
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
    Sentry.captureException(error);
  }
}

/**
 * Handle customer.subscription.updated event
 *
 * Syncs status, current period end, and price id with Stripe.
 */
async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      console.warn(
        `customer.subscription.updated: no local subscription for stripeSubscriptionId=${stripeSubscription.id}`
      );
      return;
    }

    const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED'> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      paused: 'PAUSED',
      trialing: 'ACTIVE',
      incomplete: 'PAST_DUE',
      incomplete_expired: 'CANCELED',
      unpaid: 'PAST_DUE',
    };

    const newStatus = statusMap[stripeSubscription.status] ?? 'ACTIVE';
    const firstItem = stripeSubscription.items.data[0];
    const stripePriceId = firstItem?.price?.id ?? subscription.stripePriceId;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: newStatus,
        stripePriceId,
      },
    });
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
    Sentry.captureException(error);
  }
}
