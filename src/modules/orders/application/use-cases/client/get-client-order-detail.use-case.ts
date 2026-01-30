import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { OrderRepository } from '../../ports/order.repository.interface';
import { OrderStatusValue } from '../../../domain/value-objects/order-status.vo';

export interface GetClientOrderDetailInput {
  orderId: string;
  customerId: string;
}

export interface ClientOrderItemDetail {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface ShippingAddressDetail {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface GetClientOrderDetailOutput {
  id: string;
  orderNumber: string;
  creatorId: string;
  customerId: string;
  items: ClientOrderItemDetail[];
  shippingAddress: ShippingAddressDetail;
  status: OrderStatusValue;
  totalAmount: number;
  trackingNumber?: string;
  carrier?: string;
  cancellationReason?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Use Case: Get Client Order Detail
 *
 * Story 12-2: Suivi commande en cours
 *
 * Retrieves detailed information about a specific order for the customer.
 * Only the customer who placed the order can access it.
 *
 * Acceptance Criteria:
 * - AC1: Page detail commande client avec timeline
 * - AC2: Statut de livraison avec tracking
 */
export class GetClientOrderDetailUseCase
  implements UseCase<GetClientOrderDetailInput, GetClientOrderDetailOutput>
{
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: GetClientOrderDetailInput): Promise<Result<GetClientOrderDetailOutput>> {
    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!input.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail('Commande non trouvee');
    }

    if (order.customerId !== input.customerId) {
      return Result.fail("Vous n'etes pas autorise a voir cette commande");
    }

    return Result.ok({
      id: order.idString,
      orderNumber: order.orderNumber,
      creatorId: order.creatorId,
      customerId: order.customerId,
      items: order.items.map((item) => ({
        id: item.idString,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantInfo: item.variantInfo,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        image: item.image,
      })),
      shippingAddress: order.shippingAddress,
      status: order.status.value,
      totalAmount: order.totalAmount,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      cancellationReason: order.cancellationReason,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }
}
