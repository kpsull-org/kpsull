import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { OrderRepository } from '../ports/order.repository.interface';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface ShipOrderInput {
  orderId: string;
  creatorId: string;
  trackingNumber: string;
  carrier: string;
}

export interface ShipOrderOutput {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  trackingNumber: string;
  carrier: string;
  shippedAt: Date;
}

/**
 * Use Case: Ship Order
 *
 * Marks an order as shipped with tracking information.
 * Only paid orders can be shipped.
 */
export class ShipOrderUseCase implements UseCase<ShipOrderInput, ShipOrderOutput> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ShipOrderInput): Promise<Result<ShipOrderOutput>> {
    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!input.trackingNumber?.trim()) {
      return Result.fail('Le numéro de suivi est requis');
    }

    if (!input.carrier?.trim()) {
      return Result.fail('Le transporteur est requis');
    }

    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail('Commande non trouvée');
    }

    if (order.creatorId !== input.creatorId) {
      return Result.fail("Vous n'êtes pas autorisé à modifier cette commande");
    }

    const shipResult = order.ship(input.trackingNumber, input.carrier);
    if (shipResult.isFailure) {
      return Result.fail(shipResult.error!);
    }

    await this.orderRepository.save(order);

    return Result.ok({
      id: order.idString,
      orderNumber: order.orderNumber,
      status: order.status.value,
      trackingNumber: order.trackingNumber!,
      carrier: order.carrier!,
      shippedAt: order.shippedAt!,
    });
  }
}
