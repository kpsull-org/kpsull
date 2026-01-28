import { stripe } from '@/lib/stripe/client';
import { Result } from '@/shared/domain';
import {
  IStripeBillingService,
  CreateCheckoutSessionInput,
  CheckoutSessionResult,
} from '../../application/ports/stripe-billing.service.interface';

/**
 * Stripe Billing Service
 *
 * Handles Stripe subscription billing operations for plan upgrades.
 */
export class StripeBillingService implements IStripeBillingService {
  private readonly proPriceId: string;
  private readonly baseUrl: string;

  constructor() {
    this.proPriceId = process.env.STRIPE_PRO_PRICE_ID || '';
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<Result<CheckoutSessionResult>> {
    try {
      if (!this.proPriceId) {
        return Result.fail('STRIPE_PRO_PRICE_ID non configuré');
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: input.customerId || undefined,
        customer_email: input.customerId ? undefined : input.email,
        line_items: [
          {
            price: this.proPriceId,
            quantity: 1,
          },
        ],
        success_url: `${this.baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.baseUrl}/subscription/cancel`,
        metadata: {
          userId: input.userId,
          creatorId: input.creatorId,
          plan: 'PRO',
        },
        subscription_data: {
          metadata: {
            userId: input.userId,
            creatorId: input.creatorId,
          },
        },
      });

      if (!session.url) {
        return Result.fail('URL de checkout non générée');
      }

      return Result.ok({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Stripe Checkout error:', error);
      return Result.fail('Erreur lors de la création de la session de paiement');
    }
  }

  async getCheckoutSession(sessionId: string): Promise<Result<{
    subscriptionId: string;
    customerId: string;
    status: string;
    metadata: Record<string, string>;
  }>> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session.subscription || !session.customer) {
        return Result.fail('Session incomplète');
      }

      return Result.ok({
        subscriptionId: session.subscription as string,
        customerId: session.customer as string,
        status: session.status || 'unknown',
        metadata: (session.metadata || {}) as Record<string, string>,
      });
    } catch (error) {
      console.error('Get Checkout Session error:', error);
      return Result.fail('Erreur lors de la récupération de la session');
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Result<void>> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
      return Result.ok();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return Result.fail('Erreur lors de l\'annulation de l\'abonnement');
    }
  }
}
