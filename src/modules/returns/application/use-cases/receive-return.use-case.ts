import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';
import { findAndValidateReturn } from './return-use-case.helpers';

export interface ReceiveReturnInput {
  returnId: string;
  creatorId: string;
}

export interface ReceiveReturnOutput {
  id: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatusValue;
  receivedAt: Date;
}

/**
 * Use Case: Receive Return
 *
 * Allows a creator to confirm they have received a returned item.
 * This is the step before processing the refund.
 *
 * Acceptance Criteria:
 * - Only shipped_back returns can be marked as received
 * - Status changes to RECEIVED
 * - Ready for refund processing
 */
export class ReceiveReturnUseCase implements UseCase<ReceiveReturnInput, ReceiveReturnOutput> {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async execute(input: ReceiveReturnInput): Promise<Result<ReceiveReturnOutput>> {
    const findResult = await findAndValidateReturn(
      this.returnRepository,
      input.returnId,
      input.creatorId,
      'SHIPPED_BACK',
      'Seuls les retours expedies peuvent etre marques comme recus'
    );

    if (findResult.isFailure) {
      return Result.fail(findResult.error!);
    }

    const returnRequest = findResult.value;
    const now = new Date();
    const updatedReturn = {
      ...returnRequest,
      status: 'RECEIVED' as ReturnStatusValue,
      receivedAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(updatedReturn);

    return Result.ok({
      id: updatedReturn.id,
      orderId: updatedReturn.orderId,
      orderNumber: updatedReturn.orderNumber,
      status: updatedReturn.status,
      receivedAt: now,
    });
  }
}
