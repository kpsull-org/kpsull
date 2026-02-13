import { stripe } from '@/lib/stripe/client';
import * as Sentry from '@sentry/nextjs';
import { Result } from '@/shared/domain';
import {
  IStripeBillingService,
  CreateCheckoutSessionInput,
  CheckoutSessionResult,
} from '../../application/ports/stripe-billing.service.interface';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { BillingInterval, getPlanConfig } from '../../domain/plan-features';

/**
 * Map of plan and interval to Stripe Price ID environment variable names
 */
const PRICE_ENV_MAP: Record<PlanType, Record<BillingInterval, string>> = {
  ESSENTIEL: {
    month: 'STRIPE_PRICE_ESSENTIEL_MONTHLY',
    year: 'STRIPE_PRICE_ESSENTIEL_YEARLY',
  },
  STUDIO: {
    month: 'STRIPE_PRICE_STUDIO_MONTHLY',
    year: 'STRIPE_PRICE_STUDIO_YEARLY',
  },
  ATELIER: {
    month: 'STRIPE_PRICE_ATELIER_MONTHLY',
    year: 'STRIPE_PRICE_ATELIER_YEARLY',
  },
};

/**
 * Stripe Billing Service
 *
 * Handles Stripe subscription billing operations for the 3-tier plan system:
 * - ESSENTIEL: 29€/mois ou 290€/an - Commission 5% - 10 produits
 * - STUDIO: 79€/mois ou 790€/an - Commission 4% - 20 produits
 * - ATELIER: 95€/mois ou 950€/an - Commission 3% - Illimite - 14j essai
 */
export class StripeBillingService implements IStripeBillingService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  /**
   * Get Stripe Price ID for a plan and billing interval
   */
  private getPriceId(plan: PlanType, interval: BillingInterval): string | null {
    const envVar = PRICE_ENV_MAP[plan]?.[interval];
    if (!envVar) return null;
    return process.env[envVar] || null;
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput & {
      plan?: PlanType;
      billingInterval?: BillingInterval;
      withTrial?: boolean;
    }
  ): Promise<Result<CheckoutSessionResult>> {
    try {
      const plan = input.plan || 'ESSENTIEL';
      const billingInterval = input.billingInterval || 'year';
      const priceId = this.getPriceId(plan, billingInterval);

      if (!priceId) {
        return Result.fail(
          `Prix Stripe non configure pour le plan ${plan} (${billingInterval})`
        );
      }

      const planConfig = getPlanConfig(plan);

      // Prepare subscription data
      const subscriptionData: {
        metadata: Record<string, string>;
        trial_period_days?: number;
      } = {
        metadata: {
          userId: input.userId,
          creatorId: input.creatorId,
          plan,
          billingInterval,
        },
      };

      // Add trial for ATELIER plan if requested
      if (input.withTrial && planConfig.trialDays > 0) {
        subscriptionData.trial_period_days = planConfig.trialDays;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: input.customerId || undefined,
        customer_email: input.customerId ? undefined : input.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${this.baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.baseUrl}/subscription/cancel`,
        metadata: {
          userId: input.userId,
          creatorId: input.creatorId,
          plan,
          billingInterval,
        },
        subscription_data: subscriptionData,
      });

      if (!session.url) {
        return Result.fail('URL de checkout non generee');
      }

      return Result.ok({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Stripe Checkout error:', error);
      Sentry.captureException(error);
      return Result.fail('Erreur lors de la creation de la session de paiement');
    }
  }

  async getCheckoutSession(sessionId: string): Promise<
    Result<{
      subscriptionId: string;
      customerId: string;
      priceId: string;
      status: string;
      metadata: Record<string, string>;
    }>
  > {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (!session.subscription || !session.customer) {
        return Result.fail('Session incomplete');
      }

      const subscription =
        typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          : session.subscription;

      const priceId = subscription.items.data[0]?.price.id || '';

      return Result.ok({
        subscriptionId: subscription.id,
        customerId: session.customer as string,
        priceId,
        status: session.status || 'unknown',
        metadata: (session.metadata || {}) as Record<string, string>,
      });
    } catch (error) {
      console.error('Get Checkout Session error:', error);
      Sentry.captureException(error);
      return Result.fail('Erreur lors de la recuperation de la session');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Result<void>> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      return Result.ok();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      Sentry.captureException(error);
      return Result.fail("Erreur lors de l'annulation de l'abonnement");
    }
  }

  /**
   * Update subscription to a different plan or billing interval
   */
  async updateSubscription(
    subscriptionId: string,
    newPlan: PlanType,
    newInterval: BillingInterval
  ): Promise<Result<{ subscriptionId: string; priceId: string }>> {
    try {
      const priceId = this.getPriceId(newPlan, newInterval);

      if (!priceId) {
        return Result.fail(`Prix Stripe non configure pour le plan ${newPlan} (${newInterval})`);
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const itemId = subscription.items.data[0]?.id;

      if (!itemId) {
        return Result.fail('Item de souscription non trouve');
      }

      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: itemId,
            price: priceId,
          },
        ],
        metadata: {
          plan: newPlan,
          billingInterval: newInterval,
        },
        proration_behavior: 'create_prorations',
      });

      return Result.ok({
        subscriptionId: updatedSubscription.id,
        priceId,
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      Sentry.captureException(error);
      return Result.fail("Erreur lors de la mise a jour de l'abonnement");
    }
  }

  /**
   * Get subscription details from Stripe
   */
  async getSubscription(subscriptionId: string): Promise<
    Result<{
      id: string;
      status: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      priceId: string;
      trialEnd: Date | null;
    }>
  > {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Type assertion for Stripe subscription fields
      const sub = subscription as unknown as {
        id: string;
        status: string;
        current_period_start: number;
        current_period_end: number;
        trial_end: number | null;
        items: { data: Array<{ price: { id: string } }> };
      };

      return Result.ok({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        priceId: sub.items.data[0]?.price.id || '',
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      Sentry.captureException(error);
      return Result.fail("Erreur lors de la recuperation de l'abonnement");
    }
  }
}
