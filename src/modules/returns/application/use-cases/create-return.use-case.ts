import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { ReturnRepository, ReturnRequest } from '../ports/return.repository.interface';
import type { ReturnReasonValue } from '../../domain/value-objects/return-reason.vo';
import type { ReturnStatusValue } from '../../domain/value-objects/return-status.vo';

export interface CreateReturnInput {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  creatorId: string;
  reason: ReturnReasonValue;
  reasonDetails?: string;
  deliveredAt: Date;
}

export interface CreateReturnOutput {
  id: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatusValue;
  createdAt: Date;
}

/**
 * Use Case: Create Return Request
 *
 * Allows a customer to initiate a return request for a delivered order.
 * Returns can only be requested within 14 days of delivery (French consumer law).
 *
 * Acceptance Criteria:
 * - Customer can request return for delivered orders
 * - Return window: 14 days from delivery
 * - Status starts as REQUESTED
 */
export class CreateReturnUseCase implements UseCase<CreateReturnInput, CreateReturnOutput> {
  private static readonly RETURN_WINDOW_DAYS = 14;

  constructor(private readonly returnRepository: ReturnRepository) {}

  async execute(input: CreateReturnInput): Promise<Result<CreateReturnOutput>> {
    // Validate required fields
    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!input.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    if (!input.reason) {
      return Result.fail('La raison du retour est requise');
    }

    if (!input.deliveredAt) {
      return Result.fail('La date de livraison est requise');
    }

    // Check if a return already exists for this order
    const existingReturn = await this.returnRepository.findByOrderId(input.orderId);
    if (existingReturn && existingReturn.status !== 'REJECTED') {
      return Result.fail('Une demande de retour existe deja pour cette commande');
    }

    // Check return window (14 days)
    const now = new Date();
    const daysSinceDelivery = this.getDaysSinceDelivery(input.deliveredAt, now);

    if (daysSinceDelivery > CreateReturnUseCase.RETURN_WINDOW_DAYS) {
      return Result.fail(
        `Le delai de retour de ${CreateReturnUseCase.RETURN_WINDOW_DAYS} jours est depasse (${daysSinceDelivery} jours depuis la livraison)`
      );
    }

    // Generate unique ID
    const id = this.generateId();

    const returnRequest: ReturnRequest = {
      id,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      creatorId: input.creatorId,
      reason: input.reason,
      reasonDetails: input.reasonDetails?.trim(),
      status: 'REQUESTED',
      createdAt: now,
      updatedAt: now,
    };

    await this.returnRepository.save(returnRequest);

    return Result.ok({
      id: returnRequest.id,
      orderId: returnRequest.orderId,
      orderNumber: returnRequest.orderNumber,
      status: returnRequest.status,
      createdAt: returnRequest.createdAt,
    });
  }

  private getDaysSinceDelivery(deliveredAt: Date, now: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffInMs = now.getTime() - deliveredAt.getTime();
    return Math.floor(diffInMs / msPerDay);
  }

  private generateId(): string {
    // Simple CUID-like ID generation
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `ret_${timestamp}${randomPart}`;
  }
}
