import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { OrderRepository } from '../ports/order.repository.interface';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface CancelOrderInput {
  orderId: string;
  creatorId: string;
  reason: string;
}

export interface CancelOrderOutput {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  cancellationReason: string;
}

/**
 * Use Case: Cancel Order
 *
 * Story 8-5: Annulation remboursement
 *
 * Cancels an order with a mandatory reason.
 * Only orders that haven't been shipped can be cancelled.
 */
export class CancelOrderUseCase implements UseCase<CancelOrderInput, CancelOrderOutput> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: CancelOrderInput): Promise<Result<CancelOrderOutput>> {
    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!input.reason?.trim()) {
      return Result.fail("La raison d'annulation est requise");
    }

    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    if (order.creatorId !== input.creatorId) {
      return Result.fail("Vous n'etes pas autorise a modifier cette commande");
    }

    const cancelResult = order.cancel(input.reason.trim());
    if (cancelResult.isFailure) {
      return Result.fail(cancelResult.error!);
    }

    await this.orderRepository.save(order);

    return Result.ok({
      id: order.idString,
      orderNumber: order.orderNumber,
      status: order.status.value,
      cancellationReason: order.cancellationReason!,
    });
  }
}
