/**
 * Stripe Payment Processor - Strategy implementation for Stripe.
 * Uses lazy stripe client loading to avoid STRIPE_SECRET_KEY check at import time.
 */

import type Stripe from 'stripe';
import { Result } from '@/shared/domain/result';
import type {
  PaymentProcessor,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  PaymentConfirmation,
  RefundResult,
} from '@/modules/payments/application/ports/payment-processor.interface';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    // Lazy initialization - only fails when actually used, not at import
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeSDK = require('stripe').default as new (key: string, config: Stripe.StripeConfig) => Stripe;
    stripeInstance = new StripeSDK(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripeInstance;
}

export class StripePaymentProcessor implements PaymentProcessor {
  async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<Result<PaymentIntentResult>> {
    try {
      const intent = await getStripe().paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        metadata: params.metadata,
      });

      return Result.ok({
        id: intent.id,
        clientSecret: intent.client_secret ?? '',
        status: intent.status,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Stripe error';
      return Result.fail(`Stripe createPaymentIntent failed: ${message}`);
    }
  }

  async confirmPayment(
    paymentIntentId: string
  ): Promise<Result<PaymentConfirmation>> {
    try {
      const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

      const statusMap: Record<string, 'succeeded' | 'failed' | 'pending'> = {
        succeeded: 'succeeded',
        canceled: 'failed',
        requires_payment_method: 'failed',
      };

      return Result.ok({
        id: intent.id,
        status: statusMap[intent.status] ?? 'pending',
        amount: intent.amount,
        currency: intent.currency,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Stripe error';
      return Result.fail(`Stripe confirmPayment failed: ${message}`);
    }
  }

  async refund(
    paymentIntentId: string,
    amount?: number
  ): Promise<Result<RefundResult>> {
    try {
      const refund = await getStripe().refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });

      return Result.ok({
        id: refund.id,
        amount: refund.amount,
        status: refund.status ?? 'unknown',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Stripe error';
      return Result.fail(`Stripe refund failed: ${message}`);
    }
  }

  getProvider(): string {
    return 'stripe';
  }
}
