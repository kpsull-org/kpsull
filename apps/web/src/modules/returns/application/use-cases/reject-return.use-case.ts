import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';

export interface RejectReturnInput {
  returnId: string;
  creatorId: string;
  reason: string;
}

export interface RejectReturnOutput {
  id: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatusValue;
  rejectionReason: string;
  rejectedAt: Date;
}

/**
 * Use Case: Reject Return Request
 *
 * Story 9-5: Validation retour remboursement
 *
 * Rejects a return request from a customer with a mandatory reason.
 * Only returns with status REQUESTED can be rejected.
 *
 * Acceptance Criteria:
 * - AC2: Actions: Approuver ou Rejeter avec motif
 * - AC3: Mise a jour statut retour
 */
export class RejectReturnUseCase implements UseCase<RejectReturnInput, RejectReturnOutput> {
  constructor(private readonly returnRepository: ReturnRepository) {}

  async execute(input: RejectReturnInput): Promise<Result<RejectReturnOutput>> {
    if (!input.returnId?.trim()) {
      return Result.fail('Return ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!input.reason?.trim()) {
      return Result.fail('Le motif de refus est obligatoire');
    }

    const returnRequest = await this.returnRepository.findById(input.returnId);

    if (!returnRequest) {
      return Result.fail('Demande de retour non trouvee');
    }

    if (returnRequest.creatorId !== input.creatorId) {
      return Result.fail("Vous n'etes pas autorise a modifier cette demande de retour");
    }

    if (returnRequest.status !== 'REQUESTED') {
      return Result.fail('Seules les demandes en attente peuvent etre refusees');
    }

    const now = new Date();
    const trimmedReason = input.reason.trim();
    const updatedReturn = {
      ...returnRequest,
      status: 'REJECTED' as ReturnStatusValue,
      rejectionReason: trimmedReason,
      rejectedAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(updatedReturn);

    return Result.ok({
      id: updatedReturn.id,
      orderId: updatedReturn.orderId,
      orderNumber: updatedReturn.orderNumber,
      status: updatedReturn.status,
      rejectionReason: trimmedReason,
      rejectedAt: updatedReturn.rejectedAt,
    });
  }
}
