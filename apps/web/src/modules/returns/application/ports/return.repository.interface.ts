import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';
import type { ReturnReasonValue } from '../../domain/value-objects/return-reason.vo';

/**
 * Return Request DTO for persistence
 */
export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  creatorId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  reason: ReturnReasonValue;
  reasonDetails?: string;
  status: ReturnStatusValue;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  refundedAt?: Date;
}

export interface ReturnFilters {
  status?: ReturnStatusValue;
  customerId?: string;
}

export interface PaginationOptions {
  skip: number;
  take: number;
}

/**
 * Repository interface for Return Request persistence
 *
 * Story 9-5: Validation retour remboursement
 */
export interface ReturnRepository {
  save(returnRequest: ReturnRequest): Promise<void>;
  findById(id: string): Promise<ReturnRequest | null>;
  findByOrderId(orderId: string): Promise<ReturnRequest | null>;
  findByCreatorId(
    creatorId: string,
    filters?: ReturnFilters,
    pagination?: PaginationOptions
  ): Promise<{ returns: ReturnRequest[]; total: number }>;
  findByCustomerId(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<{ returns: ReturnRequest[]; total: number }>;
  delete(id: string): Promise<void>;
}
