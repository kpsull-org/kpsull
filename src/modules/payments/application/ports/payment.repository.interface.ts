import { Payment } from '../../domain/entities/payment.entity';
import { PaymentStatusValue } from '../../domain/value-objects/payment-status.vo';

export interface PaymentFilters {
  status?: PaymentStatusValue;
  creatorId?: string;
}

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface PaymentRepository {
  /**
   * Save a payment (create or update)
   */
  save(payment: Payment): Promise<void>;

  /**
   * Find a payment by its ID
   */
  findById(id: string): Promise<Payment | null>;

  /**
   * Find a payment by order ID
   */
  findByOrderId(orderId: string): Promise<Payment | null>;

  /**
   * Find payments by customer ID with optional filters and pagination
   */
  findByCustomerId(
    customerId: string,
    filters?: PaymentFilters,
    pagination?: PaginationOptions
  ): Promise<{ payments: Payment[]; total: number }>;

  /**
   * Find payments by creator ID with optional filters and pagination
   */
  findByCreatorId(
    creatorId: string,
    filters?: PaymentFilters,
    pagination?: PaginationOptions
  ): Promise<{ payments: Payment[]; total: number }>;

  /**
   * Find a payment by Stripe payment intent ID
   */
  findByStripePaymentIntentId(paymentIntentId: string): Promise<Payment | null>;
}
