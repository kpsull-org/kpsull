import { describe, it, expect } from 'vitest';
import {
  createPaymentProcessor,
  registerPaymentProcessor,
} from '../payment-processor.factory';
import type { PaymentProcessor } from '@/modules/payments/application/ports/payment-processor.interface';
import { Result } from '@/shared/domain/result';

describe('PaymentProcessorFactory', () => {
  it('should create a stripe processor by default', () => {
    const processor = createPaymentProcessor();
    expect(processor.getProvider()).toBe('stripe');
  });

  it('should create a stripe processor when explicitly requested', () => {
    const processor = createPaymentProcessor('stripe');
    expect(processor.getProvider()).toBe('stripe');
  });

  it('should throw for unknown provider', () => {
    expect(() => createPaymentProcessor('paypal')).toThrow(
      'Unknown payment provider: paypal'
    );
  });

  it('should allow registering custom providers', () => {
    const mockProcessor: PaymentProcessor = {
      createPaymentIntent: async () => Result.fail('not implemented'),
      confirmPayment: async () => Result.fail('not implemented'),
      refund: async () => Result.fail('not implemented'),
      getProvider: () => 'mock',
    };

    registerPaymentProcessor('mock', () => mockProcessor);

    const processor = createPaymentProcessor('mock');
    expect(processor.getProvider()).toBe('mock');
  });
});
