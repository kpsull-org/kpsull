import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';
import { incrementStock } from '@/modules/products/application/services/stock.service';
import { findAndValidateReturn } from './return-use-case.helpers';

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
    const findResult = await findAndValidateReturn(
      this.returnRepository,
      input.returnId,
      input.creatorId,
      'RECEIVED',
      'Seuls les retours recus peuvent etre rembourses'
    );

    if (findResult.isFailure) {
      return Result.fail(findResult.error!);
    }

    const returnRequest = findResult.value!;
    const now = new Date();
    const updatedReturn = {
      ...returnRequest,
      status: 'REFUNDED' as ReturnStatusValue,
      refundedAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(updatedReturn);

    // Restituer le stock des items retournés (si renseignés)
    if (returnRequest.returnItems && returnRequest.returnItems.length > 0) {
      await incrementStock(
        returnRequest.returnItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );
    }

    return Result.ok({
      id: updatedReturn.id,
      orderId: updatedReturn.orderId,
      orderNumber: updatedReturn.orderNumber,
      status: updatedReturn.status,
      refundedAt: now,
    });
  }
}
