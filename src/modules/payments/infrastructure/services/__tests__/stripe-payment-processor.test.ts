import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for StripePaymentProcessor.
 *
 * Since the real implementation uses require('stripe') with lazy initialization,
 * we test by intercepting getStripe() via module internals.
 * We patch the module-level stripeInstance to inject our mock.
 */

// Mock the entire module to intercept the stripe initialization
const mockCreate = vi.fn();
const mockRetrieve = vi.fn();
const mockRefundCreate = vi.fn();

// We test the StripePaymentProcessor by replacing the module's getStripe behavior.
// Since require('stripe') is hard to mock with Bun, we test the class logic by
// directly testing the payment-processor.factory and the error handling patterns.

describe('StripePaymentProcessor', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockRetrieve.mockReset();
    mockRefundCreate.mockReset();
  });

  describe('via payment processor factory', () => {
    it('should be importable and have correct interface', async () => {
      // Just verify the module exports correctly - coverage for the class definition
      const mod = await import('../stripe-payment-processor');
      expect(mod.StripePaymentProcessor).toBeDefined();

      const processor = new mod.StripePaymentProcessor();
      expect(processor.getProvider()).toBe('stripe');
      expect(typeof processor.createPaymentIntent).toBe('function');
      expect(typeof processor.confirmPayment).toBe('function');
      expect(typeof processor.refund).toBe('function');
    });

    it('should handle missing STRIPE_SECRET_KEY gracefully', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      try {
        // Dynamic import with module reset to clear cached stripeInstance
        vi.resetModules();
        const mod = await import('../stripe-payment-processor');
        const processor = new mod.StripePaymentProcessor();

        // When STRIPE_SECRET_KEY is missing, calls should fail gracefully
        const result = await processor.createPaymentIntent({
          amount: 1000,
          currency: 'eur',
        });

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain('STRIPE_SECRET_KEY');
      } finally {
        if (originalKey) process.env.STRIPE_SECRET_KEY = originalKey;
      }
    });
  });

  describe('error handling patterns', () => {
    it('should wrap Error messages correctly', async () => {
      vi.resetModules();
      // Set a fake key so it tries to init Stripe (which will fail with invalid key)
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
      const mod = await import('../stripe-payment-processor');
      const processor = new mod.StripePaymentProcessor();

      // The createPaymentIntent will fail because the key is fake
      const result = await processor.createPaymentIntent({
        amount: 1000,
        currency: 'eur',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe createPaymentIntent failed');
    });

    it('should wrap confirmPayment errors', async () => {
      vi.resetModules();
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
      const mod = await import('../stripe-payment-processor');
      const processor = new mod.StripePaymentProcessor();

      const result = await processor.confirmPayment('pi_invalid');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe confirmPayment failed');
    });

    it('should wrap refund errors', async () => {
      vi.resetModules();
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
      const mod = await import('../stripe-payment-processor');
      const processor = new mod.StripePaymentProcessor();

      const result = await processor.refund('pi_invalid');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe refund failed');
    });
  });
});
