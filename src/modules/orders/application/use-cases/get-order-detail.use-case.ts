import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { OrderRepository } from '../ports/order.repository.interface';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface GetOrderDetailInput {
  orderId: string;
  creatorId: string;
}

export interface OrderItemDetail {
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

export interface GetOrderDetailOutput {
  id: string;
  orderNumber: string;
  creatorId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItemDetail[];
  shippingAddress: ShippingAddressDetail;
  status: OrderStatusValue;
  totalAmount: number;
  stripePaymentIntentId?: string;
  trackingNumber?: string;
  carrier?: string;
  cancellationReason?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Use Case: Get Order Detail
 *
 * Retrieves detailed information about a specific order.
 * Only the creator who owns the order can access it.
 */
export class GetOrderDetailUseCase implements UseCase<GetOrderDetailInput, GetOrderDetailOutput> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: GetOrderDetailInput): Promise<Result<GetOrderDetailOutput>> {
    if (!input.orderId?.trim()) {
      return Result.fail('Order ID est requis');
    }

    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail('Commande non trouvée');
    }

    if (order.creatorId !== input.creatorId) {
      return Result.fail("Vous n'êtes pas autorisé à voir cette commande");
    }

    return Result.ok({
      id: order.idString,
      orderNumber: order.orderNumber,
      creatorId: order.creatorId,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
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
      stripePaymentIntentId: order.stripePaymentIntentId,
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
