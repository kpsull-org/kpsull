import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { OrderRepository } from '../ports/order.repository.interface';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface ListOrdersInput {
  creatorId: string;
  status?: OrderStatusValue;
  search?: string;
  customerId?: string;
  page: number;
  limit: number;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatusValue;
  totalAmount: number;
  itemCount: number;
  shippingCity: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: Date;
}

export interface ListOrdersOutput {
  orders: OrderListItem[];
  total: number;
  pages: number;
}

/**
 * Use Case: List Orders
 *
 * Lists orders for a creator with filtering, search, and pagination.
 */
export class ListOrdersUseCase implements UseCase<ListOrdersInput, ListOrdersOutput> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ListOrdersInput): Promise<Result<ListOrdersOutput>> {
    if (!input.creatorId?.trim()) {
      return Result.fail('Creator ID est requis');
    }

    const skip = (input.page - 1) * input.limit;

    const { orders, total } = await this.orderRepository.findByCreatorId(
      input.creatorId,
      {
        status: input.status,
        search: input.search,
        customerId: input.customerId,
      },
      {
        skip,
        take: input.limit,
      }
    );

    const orderList: OrderListItem[] = orders.map((order) => ({
      id: order.idString,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status.value,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      shippingCity: order.shippingAddress.city,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      createdAt: order.createdAt,
    }));

    return Result.ok({
      orders: orderList,
      total,
      pages: Math.ceil(total / input.limit),
    });
  }
}
