import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PaymentRepository } from '../ports/payment.repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentMethod, PaymentMethodValue } from '../../domain/value-objects/payment-method.vo';
import { PaymentStatusValue } from '../../domain/value-objects/payment-status.vo';

export interface CreatePaymentInput {
  orderId: string;
  customerId: string;
  creatorId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
}

export interface CreatePaymentOutput {
  id: string;
  orderId: string;
  customerId: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  paymentMethod: PaymentMethodValue;
}

/**
 * Use Case: Create Payment
 *
 * Creates a new payment for an order in PENDING status.
 */
export class CreatePaymentUseCase
  implements UseCase<CreatePaymentInput, CreatePaymentOutput>
{
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(input: CreatePaymentInput): Promise<Result<CreatePaymentOutput>> {
    // Validate input
    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!input.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!input.amount || input.amount <= 0) {
      return Result.fail('Le montant doit être supérieur à 0');
    }

    // Validate payment method
    const paymentMethodResult = PaymentMethod.fromString(input.paymentMethod);
    if (paymentMethodResult.isFailure) {
      return Result.fail(paymentMethodResult.error!);
    }

    // Check if payment already exists for this order
    const existingPayment = await this.paymentRepository.findByOrderId(input.orderId);
    if (existingPayment) {
      return Result.fail('Un paiement existe déjà pour cette commande');
    }

    // Create payment
    const paymentResult = Payment.create({
      orderId: input.orderId,
      customerId: input.customerId,
      creatorId: input.creatorId,
      amount: input.amount,
      currency: input.currency || 'EUR',
      paymentMethod: paymentMethodResult.value,
    });

    if (paymentResult.isFailure) {
      return Result.fail(paymentResult.error!);
    }

    const payment = paymentResult.value;

    // Save payment
    await this.paymentRepository.save(payment);

    return Result.ok({
      id: payment.idString,
      orderId: payment.orderId,
      customerId: payment.customerId,
      creatorId: payment.creatorId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status.value,
      paymentMethod: payment.paymentMethod.value,
    });
  }
}
