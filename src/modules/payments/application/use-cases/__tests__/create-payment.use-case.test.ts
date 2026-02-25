import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { CreatePaymentUseCase } from '../create-payment.use-case';
import { PaymentRepository } from '../../ports/payment.repository.interface';
import { Payment } from '../../../domain/entities/payment.entity';
import { PaymentMethod } from '../../../domain/value-objects/payment-method.vo';
import { Result } from '@/shared/domain';

const BASE_INPUT = {
  orderId: 'order-123',
  customerId: 'customer-123',
  creatorId: 'creator-123',
  amount: 2999,
  currency: 'EUR',
  paymentMethod: 'CARD',
} as const;

describe('CreatePayment Use Case', () => {
  let useCase: CreatePaymentUseCase;
  let mockRepository: {
    save: Mock;
    findById: Mock;
    findByOrderId: Mock;
    findByCustomerId: Mock;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

      const result = await useCase.execute({ ...BASE_INPUT });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.orderId).toBe('order-123');
      expect(result.value?.amount).toBe(2999);
      expect(result.value?.status).toBe('PENDING');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    describe('validation failures', () => {
      it.each([
        { field: 'orderId', input: { ...BASE_INPUT, orderId: '' }, expectedError: 'Order ID' },
        { field: 'customerId', input: { ...BASE_INPUT, customerId: '' }, expectedError: 'Customer ID' },
        { field: 'creatorId', input: { ...BASE_INPUT, creatorId: '' }, expectedError: 'Creator ID' },
        { field: 'amount (zero)', input: { ...BASE_INPUT, amount: 0 }, expectedError: 'montant' },
        { field: 'paymentMethod (invalid)', input: { ...BASE_INPUT, paymentMethod: 'BITCOIN' }, expectedError: 'invalide' },
        { field: 'paymentMethod (empty)', input: { ...BASE_INPUT, paymentMethod: '' }, expectedError: 'invalide' },
      ])('should fail when $field is missing or invalid', async ({ input, expectedError }) => {
        const result = await useCase.execute(input);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain(expectedError);
        expect(mockRepository.save).not.toHaveBeenCalled();
      });
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

      const result = await useCase.execute({ ...BASE_INPUT });

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

    it('should fail when Payment.create returns a failure', async () => {
      mockRepository.findByOrderId.mockResolvedValue(null);
      vi.spyOn(Payment, 'create').mockReturnValue(
        Result.fail<Payment>('Payment entity creation failed')
      );

      const result = await useCase.execute({ ...BASE_INPUT });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Payment entity creation failed');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
