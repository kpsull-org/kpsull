import { Order } from '../../domain/entities/order.entity';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface OrderFilters {
  status?: OrderStatusValue;
  search?: string;
  customerId?: string;
}

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCreatorId(
    creatorId: string,
    filters?: OrderFilters,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[]; total: number }>;
  findByCustomerId(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[]; total: number }>;
  delete(id: string): Promise<void>;
}
