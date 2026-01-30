import { Result } from '@/shared/domain';
import { UseCase } from '@/shared/application/use-case.interface';
import { OrderRepository } from '../ports/order.repository.interface';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface ListCustomerOrdersInput {
  customerId: string;
  page: number;
  limit: number;
}

export interface CustomerOrderItem {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  totalAmount: number;
  itemCount: number;
  creatorId: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: Date;
}

export interface ListCustomerOrdersOutput {
  orders: CustomerOrderItem[];
  total: number;
  pages: number;
}

/**
 * Use Case: List Customer Orders
 *
 * Story 12-1: Historique commandes client
 *
 * Lists orders for a customer with pagination.
 * Provides a simplified view focused on customer needs.
 */
export class ListCustomerOrdersUseCase implements UseCase<ListCustomerOrdersInput, ListCustomerOrdersOutput> {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ListCustomerOrdersInput): Promise<Result<ListCustomerOrdersOutput>> {
    if (!input.customerId?.trim()) {
      return Result.fail('Customer ID est requis');
    }

    if (input.page < 1) {
      return Result.fail('Le numero de page doit etre superieur a 0');
    }

    if (input.limit < 1 || input.limit > 100) {
      return Result.fail('La limite doit etre entre 1 et 100');
    }

    const skip = (input.page - 1) * input.limit;

    const { orders, total } = await this.orderRepository.findByCustomerId(
      input.customerId,
      {
        skip,
        take: input.limit,
      }
    );

    const orderList: CustomerOrderItem[] = orders.map((order) => ({
      id: order.idString,
      orderNumber: order.orderNumber,
      status: order.status.value,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      creatorId: order.creatorId,
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
