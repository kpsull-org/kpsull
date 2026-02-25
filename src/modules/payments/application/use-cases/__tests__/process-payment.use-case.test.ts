import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ProcessPaymentUseCase } from '../process-payment.use-case';
import { PaymentRepository } from '../../ports/payment.repository.interface';
import { Payment } from '../../../domain/entities/payment.entity';
import { PaymentMethod } from '../../../domain/value-objects/payment-method.vo';

describe('ProcessPayment Use Case', () => {
  let useCase: ProcessPaymentUseCase;
  let mockRepository: {
    save: Mock;
    findById: Mock;
    findByOrderId: Mock;
    findByCustomerId: Mock;
  };

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findByCustomerId: vi.fn(),
    };

    useCase = new ProcessPaymentUseCase(mockRepository as unknown as PaymentRepository);
  });

  function createTestPayment(status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' = 'PENDING'): Payment {
    const payment = Payment.create({
      orderId: 'order-123',
      customerId: 'customer-123',
      creatorId: 'creator-123',
      amount: 2999,
      currency: 'EUR',
      paymentMethod: PaymentMethod.card(),
    }).value;

    if (status === 'PROCESSING') {
      payment.markAsProcessing('pi_test_123');
    } else if (status === 'SUCCEEDED') {
      payment.markAsProcessing('pi_test_123');
      payment.markAsSucceeded();
    }

    return payment;
  }

  describe('markAsSucceeded', () => {
    it('should mark payment as succeeded', async () => {
      const payment = createTestPayment('PROCESSING');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'SUCCEED',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('SUCCEEDED');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should mark pending payment as succeeded with payment intent', async () => {
      const payment = createTestPayment('PENDING');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'SUCCEED',
        stripePaymentIntentId: 'pi_new_123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('SUCCEEDED');
      expect(result.value?.stripePaymentIntentId).toBe('pi_new_123');
    });
  });

  describe('markAsFailed', () => {
    it('should mark payment as failed with reason', async () => {
      const payment = createTestPayment('PROCESSING');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'FAIL',
        failureReason: 'Carte refusée',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('FAILED');
      expect(result.value?.failureReason).toBe('Carte refusée');
    });

    it('should use default failure reason if not provided', async () => {
      const payment = createTestPayment('PROCESSING');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'FAIL',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.failureReason).toBe('Paiement échoué');
    });

    it('should fail if payment already succeeded', async () => {
      const payment = createTestPayment('SUCCEEDED');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'FAIL',
        failureReason: 'Test',
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('validation', () => {
    it('should fail when paymentId is missing', async () => {
      const result = await useCase.execute({
        paymentId: '',
        action: 'SUCCEED',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Payment ID');
    });

    it('should fail when payment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        paymentId: 'unknown-123',
        action: 'SUCCEED',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    // Both INVALID and UNKNOWN_ACTION hit the same validation guard before the switch
    it.each([
      { label: 'invalid action', action: 'INVALID' as 'SUCCEED' },
      { label: 'unknown action reaching switch default', action: 'UNKNOWN_ACTION' as 'SUCCEED' },
    ])('should fail for $label', async ({ action }) => {
      const payment = createTestPayment('PROCESSING');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Action invalide');
    });
  });

  describe('refund', () => {
    it('should refund a succeeded payment', async () => {
      const payment = createTestPayment('SUCCEEDED');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'REFUND',
        stripeRefundId: 're_test_123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('REFUNDED');
      expect(result.value?.stripeRefundId).toBe('re_test_123');
    });

    it('should fail refund without refundId', async () => {
      const payment = createTestPayment('SUCCEEDED');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'REFUND',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Refund ID');
    });

    it('should fail to refund pending payment', async () => {
      const payment = createTestPayment('PENDING');
      mockRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute({
        paymentId: payment.idString,
        action: 'REFUND',
        stripeRefundId: 're_test_123',
      });

      expect(result.isFailure).toBe(true);
    });
  });
});
