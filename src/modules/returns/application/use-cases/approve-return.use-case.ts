import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';

export interface ApproveReturnInput {
  returnId: string;
  creatorId: string;
}

export interface ApproveReturnOutput {
  id: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatusValue;
  approvedAt: Date;
}

/**
 * Use Case: Approve Return Request
 *
 * Story 9-5: Validation retour remboursement
 *
 * Approves a return request from a customer.
 * Only returns with status REQUESTED can be approved.
 *
 * Acceptance Criteria:
 * - AC2: Actions: Approuver ou Rejeter avec motif
 * - AC3: Mise a jour statut retour
 */
export class ApproveReturnUseCase implements UseCase<ApproveReturnInput, ApproveReturnOutput> {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async execute(input: ApproveReturnInput): Promise<Result<ApproveReturnOutput>> {
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

    if (returnRequest.status !== 'REQUESTED') {
      return Result.fail('Seules les demandes en attente peuvent etre approuvees');
    }

    const now = new Date();
    const updatedReturn = {
      ...returnRequest,
      status: 'APPROVED' as ReturnStatusValue,
      approvedAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(updatedReturn);

    return Result.ok({
      id: updatedReturn.id,
      orderId: updatedReturn.orderId,
      orderNumber: updatedReturn.orderNumber,
      status: updatedReturn.status,
      approvedAt: updatedReturn.approvedAt,
    });
  }
}
