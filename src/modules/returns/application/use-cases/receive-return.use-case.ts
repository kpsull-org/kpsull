import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';

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

    if (returnRequest.status !== 'SHIPPED_BACK') {
      return Result.fail('Seuls les retours expedies peuvent etre marques comme recus');
    }

    const now = new Date();
    const updatedReturn = {
      ...returnRequest,
      status: 'RECEIVED' as ReturnStatusValue,
      receivedAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(updatedReturn as typeof returnRequest);

    return Result.ok({
      id: updatedReturn.id,
      orderId: updatedReturn.orderId,
      orderNumber: updatedReturn.orderNumber,
      status: updatedReturn.status,
      receivedAt: now,
    });
  }
}
