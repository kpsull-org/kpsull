import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CreatePaymentUseCase } from '../create-payment.use-case';
import { PaymentRepository } from '../../ports/payment.repository.interface';
import { Payment } from '../../../domain/entities/payment.entity';
import { PaymentMethod } from '../../../domain/value-objects/payment-method.vo';

describe('CreatePayment Use Case', () => {
  let useCase: CreatePaymentUseCase;
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

    useCase = new CreatePaymentUseCase(mockRepository as unknown as PaymentRepository);
  });

  describe('execute', () => {
    it('should create a payment successfully', async () => {
      mockRepository.findByOrderId.mockResolvedValue(null);

      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: 'CARD',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.orderId).toBe('order-123');
      expect(result.value?.amount).toBe(2999);
      expect(result.value?.status).toBe('PENDING');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail when orderId is missing', async () => {
      const result = await useCase.execute({
        orderId: '',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: 'CARD',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Order ID');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when customerId is missing', async () => {
      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: '',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: 'CARD',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Customer ID');
    });

    it('should fail when creatorId is missing', async () => {
      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: '',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: 'CARD',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail when amount is zero', async () => {
      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 0,
        currency: 'EUR',
        paymentMethod: 'CARD',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('montant');
    });

    it('should fail when payment method is invalid', async () => {
      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: 'BITCOIN',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should fail when payment already exists for order', async () => {
      const existingPayment = Payment.create({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: PaymentMethod.card(),
      }).value;

      mockRepository.findByOrderId.mockResolvedValue(existingPayment);

      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        currency: 'EUR',
        paymentMethod: 'CARD',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('existe déjà');
    });

    it('should use EUR as default currency', async () => {
      mockRepository.findByOrderId.mockResolvedValue(null);

      const result = await useCase.execute({
        orderId: 'order-123',
        customerId: 'customer-123',
        creatorId: 'creator-123',
        amount: 2999,
        paymentMethod: 'CARD',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.currency).toBe('EUR');
    });

    it('should accept all valid payment methods', async () => {
      mockRepository.findByOrderId.mockResolvedValue(null);

      const methods = ['CARD', 'SEPA', 'APPLE_PAY', 'GOOGLE_PAY'];

      for (const method of methods) {
        mockRepository.save.mockClear();

        const result = await useCase.execute({
          orderId: `order-${method}`,
          customerId: 'customer-123',
          creatorId: 'creator-123',
          amount: 2999,
          currency: 'EUR',
          paymentMethod: method,
        });

        expect(result.isSuccess).toBe(true);
        expect(result.value?.paymentMethod).toBe(method);
      }
    });
  });
});
