/**
 * Payment Processor Factory - Creates the appropriate payment processor.
 * Extensible: register new providers at runtime.
 */

import type { PaymentProcessor } from '@/modules/payments/application/ports/payment-processor.interface';
import { StripePaymentProcessor } from './stripe-payment-processor';

type PaymentProcessorFactory = () => PaymentProcessor;

const processors = new Map<string, PaymentProcessorFactory>();

// Register Stripe by default
processors.set('stripe', () => new StripePaymentProcessor());

export function registerPaymentProcessor(
  provider: string,
  factory: PaymentProcessorFactory
): void {
  processors.set(provider, factory);
}

export function createPaymentProcessor(
  provider: string = 'stripe'
): PaymentProcessor {
  const factory = processors.get(provider);
  if (!factory) {
    throw new Error(
      `Unknown payment provider: ${provider}. Available: ${Array.from(processors.keys()).join(', ')}`
    );
  }
  return factory();
}
