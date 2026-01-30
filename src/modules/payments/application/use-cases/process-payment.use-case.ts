import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { PaymentRepository } from '../ports/payment.repository.interface';
import { PaymentStatusValue } from '../../domain/value-objects/payment-status.vo';
import { PaymentMethodValue } from '../../domain/value-objects/payment-method.vo';

export type ProcessPaymentAction = 'SUCCEED' | 'FAIL' | 'REFUND';

export interface ProcessPaymentInput {
  paymentId: string;
  action: ProcessPaymentAction;
  stripePaymentIntentId?: string;
  stripeRefundId?: string;
  failureReason?: string;
}

export interface ProcessPaymentOutput {
  id: string;
  orderId: string;
  status: PaymentStatusValue;
  paymentMethod: PaymentMethodValue;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  failureReason: string | null;
}

/**
 * Use Case: Process Payment
 *
 * Handles payment state transitions: mark as succeeded, failed, or refunded.
 */
export class ProcessPaymentUseCase
  implements UseCase<ProcessPaymentInput, ProcessPaymentOutput>
{
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(input: ProcessPaymentInput): Promise<Result<ProcessPaymentOutput>> {
    // Validate input
    if (!input.paymentId?.trim()) {
      return Result.fail('Payment ID est requis');
    }

    const validActions: ProcessPaymentAction[] = ['SUCCEED', 'FAIL', 'REFUND'];
    if (!validActions.includes(input.action)) {
      return Result.fail(`Action invalide: ${input.action}`);
    }

    // Get payment
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment) {
      return Result.fail('Paiement non trouvé');
    }

    // Process action
    let actionResult: Result<void>;

    switch (input.action) {
      case 'SUCCEED':
        actionResult = payment.markAsSucceeded(input.stripePaymentIntentId);
        break;

      case 'FAIL':
        actionResult = payment.markAsFailed(input.failureReason || 'Paiement échoué');
        break;

      case 'REFUND':
        if (!input.stripeRefundId?.trim()) {
          return Result.fail('Stripe Refund ID est requis pour un remboursement');
        }
        actionResult = payment.refund(input.stripeRefundId);
        break;

      default:
        return Result.fail(`Action invalide: ${input.action}`);
    }

    if (actionResult.isFailure) {
      return Result.fail(actionResult.error!);
    }

    // Save updated payment
    await this.paymentRepository.save(payment);

    return Result.ok({
      id: payment.idString,
      orderId: payment.orderId,
      status: payment.status.value,
      paymentMethod: payment.paymentMethod.value,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeRefundId: payment.stripeRefundId,
      failureReason: payment.failureReason,
    });
  }
}
