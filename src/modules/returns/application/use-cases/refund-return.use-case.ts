import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';

export interface RefundReturnInput {
  returnId: string;
  creatorId: string;
}

export interface RefundReturnOutput {
  id: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatusValue;
  refundedAt: Date;
}

/**
 * Use Case: Refund Return
 *
 * Marks a received return as refunded after payment processing.
 * This should be called after the Stripe refund is processed.
 *
 * Acceptance Criteria:
 * - Only received returns can be refunded
 * - Status changes to REFUNDED (final state)
 */
export class RefundReturnUseCase implements UseCase<RefundReturnInput, RefundReturnOutput> {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async execute(input: RefundReturnInput): Promise<Result<RefundReturnOutput>> {
    if (!input.returnId?.trim()) {
      return Result.fail('Return ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const returnRequest = await this.returnRepository.findById(input.returnId);

    if (!returnRequest) {
      return Result.fail('Demande de retour non trouvee');
    }

    if (returnRequest.creatorId !== input.creatorId) {
      return Result.fail("Vous n'etes pas autorise a modifier cette demande de retour");
    }

    if (returnRequest.status !== 'RECEIVED') {
      return Result.fail('Seuls les retours recus peuvent etre rembourses');
    }

    const now = new Date();
    const updatedReturn = {
      ...returnRequest,
      status: 'REFUNDED' as ReturnStatusValue,
      refundedAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(updatedReturn);

    return Result.ok({
      id: updatedReturn.id,
      orderId: updatedReturn.orderId,
      orderNumber: updatedReturn.orderNumber,
      status: updatedReturn.status,
      refundedAt: now,
    });
  }
}
