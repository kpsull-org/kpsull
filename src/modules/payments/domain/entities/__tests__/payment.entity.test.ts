import { describe, it, expect } from 'vitest';
import { Payment } from '../payment.entity';
import { PaymentMethod } from '../../value-objects/payment-method.vo';

describe('Payment Entity', () => {
  describe('create', () => {
    it('should create a pending payment', () => {
      const result = Payment.create({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: PaymentMethod.card(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status.isPending).toBe(true);
      expect(result.value?.amount).toBe(2999);
      expect(result.value?.currency).toBe('EUR');
    });

    it.each([
      { label: 'orderId is missing', props: { orderId: '', customerId: 'customer-123', creatorId: 'creator-123', amount: 2999 }, expectedError: 'Order ID' },
      { label: 'customerId is missing', props: { orderId: 'order-123', customerId: '', creatorId: 'creator-123', amount: 2999 }, expectedError: 'Customer ID' },
      { label: 'creatorId is missing', props: { orderId: 'order-123', customerId: 'customer-123', creatorId: '', amount: 2999 }, expectedError: 'Creator ID' },
      { label: 'amount is zero', props: { orderId: 'order-123', customerId: 'customer-123', creatorId: 'creator-123', amount: 0 }, expectedError: 'montant' },
      { label: 'amount is negative', props: { orderId: 'order-123', customerId: 'customer-123', creatorId: 'creator-123', amount: -100 }, expectedError: 'montant' },
    ])('should fail when $label', ({ props, expectedError }) => {
      const result = Payment.create({
        ...props,
        currency: 'EUR',
        paymentMethod: PaymentMethod.card(),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(expectedError);
    });
  });

  describe('markAsProcessing', () => {
    it('should mark payment as processing', () => {
      const payment = createTestPayment();

      const result = payment.markAsProcessing('pi_test_123');

      expect(result.isSuccess).toBe(true);
      expect(payment.status.isProcessing).toBe(true);
      expect(payment.stripePaymentIntentId).toBe('pi_test_123');
    });

    it('should fail if already processing', () => {
      const payment = createTestPayment();
      payment.markAsProcessing('pi_test_123');

      const result = payment.markAsProcessing('pi_test_456');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('état actuel');
    });
  });

  describe('markAsSucceeded', () => {
    it('should mark payment as succeeded from processing', () => {
      const payment = createTestPayment();
      payment.markAsProcessing('pi_test_123');

      const result = payment.markAsSucceeded();

      expect(result.isSuccess).toBe(true);
      expect(payment.status.isSucceeded).toBe(true);
    });

    it('should mark payment as succeeded from pending with payment intent', () => {
      const payment = createTestPayment();

      const result = payment.markAsSucceeded('pi_test_123');

      expect(result.isSuccess).toBe(true);
      expect(payment.status.isSucceeded).toBe(true);
      expect(payment.stripePaymentIntentId).toBe('pi_test_123');
    });

    it('should fail if already succeeded', () => {
      const payment = createTestPayment();
      payment.markAsProcessing('pi_test_123');
      payment.markAsSucceeded();

      const result = payment.markAsSucceeded();

      expect(result.isFailure).toBe(true);
    });
  });

  describe('markAsFailed', () => {
    it('should mark payment as failed with reason', () => {
      const payment = createTestPayment();
      payment.markAsProcessing('pi_test_123');

      const result = payment.markAsFailed('Carte refusée');

      expect(result.isSuccess).toBe(true);
      expect(payment.status.isFailed).toBe(true);
      expect(payment.failureReason).toBe('Carte refusée');
    });

    it('should mark payment as failed from pending', () => {
      const payment = createTestPayment();

      const result = payment.markAsFailed('Erreur de validation');

      expect(result.isSuccess).toBe(true);
      expect(payment.status.isFailed).toBe(true);
    });

    it('should fail if already failed', () => {
      const payment = createTestPayment();
      payment.markAsFailed('Première erreur');

      const result = payment.markAsFailed('Deuxième erreur');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('refund', () => {
    it('should refund a succeeded payment', () => {
      const payment = createTestPayment();
      payment.markAsProcessing('pi_test_123');
      payment.markAsSucceeded();

      const result = payment.refund('re_test_123');

      expect(result.isSuccess).toBe(true);
      expect(payment.status.isRefunded).toBe(true);
      expect(payment.stripeRefundId).toBe('re_test_123');
    });

    it('should fail to refund pending payment', () => {
      const payment = createTestPayment();

      const result = payment.refund('re_test_123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('réussi');
    });

    it('should fail to refund failed payment', () => {
      const payment = createTestPayment();
      payment.markAsFailed('Erreur');

      const result = payment.refund('re_test_123');

      expect(result.isFailure).toBe(true);
    });

    it('should fail to refund already refunded payment', () => {
      const payment = createTestPayment();
      payment.markAsProcessing('pi_test_123');
      payment.markAsSucceeded();
      payment.refund('re_test_123');

      const result = payment.refund('re_test_456');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute payment from persistence', () => {
      const now = new Date();

      const result = Payment.reconstitute({
        id: 'payment-123',
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        status: 'SUCCEEDED',
        paymentMethod: 'CARD',
        stripePaymentIntentId: 'pi_test_123',
        stripeRefundId: null,
        failureReason: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.idString).toBe('payment-123');
      expect(result.value?.status.isSucceeded).toBe(true);
      expect(result.value?.paymentMethod.isCard).toBe(true);
    });

    it('should fail for invalid status', () => {
      const now = new Date();

      const result = Payment.reconstitute({
        id: 'payment-123',
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        status: 'INVALID',
        paymentMethod: 'CARD',
        stripePaymentIntentId: null,
        stripeRefundId: null,
        failureReason: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isFailure).toBe(true);
    });

    it('should fail for invalid payment method', () => {
      const now = new Date();

      const result = Payment.reconstitute({
        id: 'payment-123',
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        status: 'PENDING',
        paymentMethod: 'BITCOIN',
        stripePaymentIntentId: null,
        stripeRefundId: null,
        failureReason: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return formatted amount', () => {
      const payment = createTestPayment(2999);

      // Intl.NumberFormat uses non-breaking space (U+00A0) between number and currency
      expect(payment.formattedAmount).toContain('29,99');
      expect(payment.formattedAmount).toContain('€');
    });

    it('should return display amount', () => {
      const payment = createTestPayment(2999);

      expect(payment.displayAmount).toBe(29.99);
    });

    it('should return createdAt and updatedAt', () => {
      const payment = createTestPayment(2999);

      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.updatedAt).toBeInstanceOf(Date);
    });

    it('should default currency to EUR when not provided', () => {
      const result = Payment.create({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 1000,
        currency: '',
        paymentMethod: PaymentMethod.card(),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.currency).toBe('EUR');
    });
  });
});

function createTestPayment(amount = 2999): Payment {
  return Payment.create({
    orderId: 'order-123',
    customerId: 'customer-123',
    creatorId: 'creator-123',
    amount,
    currency: 'EUR',
    paymentMethod: PaymentMethod.card(),
  }).value;
}
