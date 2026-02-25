import { Prisma, PrismaClient, OrderStatus as PrismaOrderStatus } from '@prisma/client';
import {
  OrderRepository,
  OrderFilters,
  PaginationOptions,
} from '../../application/ports/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderStatusValue } from '../../domain/value-objects/order-status.vo';
import { ConcurrentModificationError } from '../errors/concurrent-modification.error';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    const data = {
      id: order.idString,
      orderNumber: order.orderNumber,
      creatorId: order.creatorId,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status.value as PrismaOrderStatus,
      totalAmount: order.totalAmount,
      shippingStreet: order.shippingAddress.street,
      shippingCity: order.shippingAddress.city,
      shippingPostalCode: order.shippingAddress.postalCode,
      shippingCountry: order.shippingAddress.country,
      stripePaymentIntentId: order.stripePaymentIntentId ?? null,
      stripeRefundId: order.stripeRefundId ?? null,
      trackingNumber: order.trackingNumber ?? null,
      carrier: order.carrier ?? null,
      cancellationReason: order.cancellationReason ?? null,
      shippedAt: order.shippedAt ?? null,
      deliveredAt: order.deliveredAt ?? null,
      shippingMode: order.shippingMode ?? null,
      relayPointId: order.relayPointId ?? null,
      relayPointName: order.relayPointName ?? null,
      shippingCost: order.shippingCost ?? null,
      updatedAt: new Date(),
    };

    await this.prisma.$transaction(async (tx) => {
      // Check for concurrent modification using optimistic locking
      const existing = await tx.order.findUnique({
        where: { id: order.idString },
        select: { updatedAt: true },
      });

      // Lock optimiste: verifier que updatedAt n'a pas change
      if (existing && existing.updatedAt.getTime() !== order.updatedAt.getTime()) {
        throw new ConcurrentModificationError(
          `La commande ${order.idString} a ete modifiee par un autre processus`
        );
      }

      await tx.order.upsert({
        where: { id: order.idString },
        create: {
          ...data,
          createdAt: order.createdAt,
        },
        update: data,
      });

      // Delete existing items and recreate
      await tx.orderItem.deleteMany({
        where: { orderId: order.idString },
      });

      /* c8 ignore start */
      if (order.items.length > 0) {
        await tx.orderItem.createMany({
          data: order.items.map((item) => ({
            id: item.idString,
            orderId: order.idString,
            productId: item.productId,
            variantId: item.variantId ?? null,
            productName: item.productName,
            variantInfo: item.variantInfo ?? null,
            price: item.price,
            quantity: item.quantity,
            image: item.image ?? null,
          })),
        });
      }
      /* c8 ignore stop */
    });
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return null;
    }

    return this.toDomain(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return null;
    }

    return this.toDomain(order);
  }

  async findByCreatorId(
    creatorId: string,
    filters?: OrderFilters,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[]; total: number }> {
    const where: Prisma.OrderWhereInput = { creatorId };

    if (filters?.status) {
      where.status = filters.status as PrismaOrderStatus;
    }

    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    return this.findOrdersWithPagination(where, pagination);
  }

  async findByCustomerId(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[]; total: number }> {
    const where: Prisma.OrderWhereInput = { customerId };

    return this.findOrdersWithPagination(where, pagination);
  }

  private async findOrdersWithPagination(
    where: Prisma.OrderWhereInput,
    pagination?: PaginationOptions
  ): Promise<{ orders: Order[]; total: number }> {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: pagination?.skip ?? 0,
        take: pagination?.take ?? 20,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: await Promise.all(orders.map((o) => this.toDomain(o))),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  private async toDomain(prismaOrder: OrderWithItems): Promise<Order> {
    const items: OrderItem[] = [];

    for (const item of prismaOrder.items) {
      const itemResult = OrderItem.reconstitute({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        productName: item.productName,
        variantInfo: item.variantInfo ?? undefined,
        price: item.price,
        quantity: item.quantity,
        image: item.image ?? undefined,
      });

      /* c8 ignore start */
      if (itemResult.isFailure) {
        throw new Error(`Failed to reconstitute OrderItem ${item.id}: ${itemResult.error}`);
      }
      /* c8 ignore stop */

      items.push(itemResult.value);
    }

    const orderResult = Order.reconstitute({
      id: prismaOrder.id,
      orderNumber: prismaOrder.orderNumber,
      creatorId: prismaOrder.creatorId,
      customerId: prismaOrder.customerId,
      customerName: prismaOrder.customerName,
      customerEmail: prismaOrder.customerEmail,
      items,
      shippingAddress: {
        street: prismaOrder.shippingStreet,
        city: prismaOrder.shippingCity,
        postalCode: prismaOrder.shippingPostalCode,
        country: prismaOrder.shippingCountry,
      },
      status: prismaOrder.status as OrderStatusValue,
      totalAmount: prismaOrder.totalAmount,
      stripePaymentIntentId: prismaOrder.stripePaymentIntentId ?? undefined,
      stripeRefundId: prismaOrder.stripeRefundId ?? undefined,
      trackingNumber: prismaOrder.trackingNumber ?? undefined,
      carrier: prismaOrder.carrier ?? undefined,
      cancellationReason: prismaOrder.cancellationReason ?? undefined,
      shippedAt: prismaOrder.shippedAt ?? undefined,
      deliveredAt: prismaOrder.deliveredAt ?? undefined,
      shippingMode: prismaOrder.shippingMode ?? undefined,
      relayPointId: prismaOrder.relayPointId ?? undefined,
      relayPointName: prismaOrder.relayPointName ?? undefined,
      shippingCost: prismaOrder.shippingCost ?? undefined,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
    });

    if (orderResult.isFailure) {
      throw new Error(`Failed to reconstitute order: ${orderResult.error}`);
    }

    return orderResult.value;
  }
}
