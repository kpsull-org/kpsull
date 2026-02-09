/**
 * Payment Processor port - Strategy Pattern for payment processing.
 * Allows swapping payment providers without changing business logic.
 */

import { Result } from '@/shared/domain/result';

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: string;
}

export interface PaymentConfirmation {
  id: string;
  status: 'succeeded' | 'failed' | 'pending';
  amount: number;
  currency: string;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: string;
}

export interface PaymentProcessor {
  createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<Result<PaymentIntentResult>>;
  confirmPayment(paymentIntentId: string): Promise<Result<PaymentConfirmation>>;
  refund(
    paymentIntentId: string,
    amount?: number
  ): Promise<Result<RefundResult>>;
  getProvider(): string;
}
