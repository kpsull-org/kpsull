import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository, ReturnFilters } from '../ports/return.repository.interface';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';
import type { ReturnReasonValue } from '../../domain/value-objects/return-reason.vo';

export interface ListReturnsInput {
  creatorId: string;
  status?: ReturnStatusValue;
  page?: number;
  limit?: number;
}

export interface ReturnListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: ReturnReasonValue;
  reasonDetails?: string;
  status: ReturnStatusValue;
  rejectionReason?: string;
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface ListReturnsOutput {
  returns: ReturnListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Use Case: List Return Requests for a Creator
 *
 * Story 9-5: Validation retour remboursement
 *
 * Lists all return requests for a creator with optional filtering.
 *
 * Acceptance Criteria:
 * - AC1: Page createur pour voir les demandes de retour
 * - AC4: Affichage dans dashboard createur
 */
export class ListReturnsUseCase implements UseCase<ListReturnsInput, ListReturnsOutput> {
  private static readonly DEFAULT_LIMIT = 10;

  constructor(private readonly returnRepository: ReturnRepository) {}

  async execute(input: ListReturnsInput): Promise<Result<ListReturnsOutput>> {
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(50, Math.max(1, input.limit ?? ListReturnsUseCase.DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const filters: ReturnFilters = {};
    if (input.status) {
      filters.status = input.status;
    }

    const { returns, total } = await this.returnRepository.findByCreatorId(
      input.creatorId,
      filters,
      { skip, take: limit }
    );

    const returnItems: ReturnListItem[] = returns.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      reason: r.reason,
      reasonDetails: r.reasonDetails,
      status: r.status,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      approvedAt: r.approvedAt,
      rejectedAt: r.rejectedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return Result.ok({
      returns: returnItems,
      total,
      page,
      totalPages,
    });
  }
}
