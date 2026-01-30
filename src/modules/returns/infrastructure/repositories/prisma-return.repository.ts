import { Prisma, PrismaClient, ReturnStatus as PrismaReturnStatus, ReturnReason as PrismaReturnReason } from '@prisma/client';
import type {
  ReturnRepository,
  ReturnRequest,
  ReturnFilters,
  PaginationOptions,
} from '../../application/ports/return.repository.interface';

type PrismaReturnRequest = Prisma.ReturnRequestGetPayload<{ include: { order: true } }>;

/**
 * Prisma Return Repository implementation
 *
 * Persists return requests to PostgreSQL via Prisma ORM.
 */
export class PrismaReturnRepository implements ReturnRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(returnRequest: ReturnRequest): Promise<void> {
    // Type assertion for extended fields that might be on the object
    const extendedReturn = returnRequest as ReturnRequest & {
      trackingNumber?: string;
      carrier?: string;
      shippedAt?: Date;
      receivedAt?: Date;
    };

    const data = {
      id: returnRequest.id,
      orderId: returnRequest.orderId,
      customerId: returnRequest.customerId,
      creatorId: returnRequest.creatorId,
      reason: returnRequest.reason as PrismaReturnReason,
      additionalNotes: returnRequest.reasonDetails ?? null,
      status: returnRequest.status as PrismaReturnStatus,
      rejectionReason: returnRequest.rejectionReason ?? null,
      trackingNumber: extendedReturn.trackingNumber ?? null,
      carrier: extendedReturn.carrier ?? null,
      deliveredAt: returnRequest.createdAt, // Use createdAt as deliveredAt placeholder
      approvedAt: returnRequest.approvedAt ?? null,
      rejectedAt: returnRequest.rejectedAt ?? null,
      shippedAt: extendedReturn.shippedAt ?? null,
      receivedAt: extendedReturn.receivedAt ?? null,
      refundedAt: returnRequest.refundedAt ?? null,
      updatedAt: returnRequest.updatedAt,
    };

    await this.prisma.returnRequest.upsert({
      where: { id: returnRequest.id },
      create: {
        ...data,
        createdAt: returnRequest.createdAt,
      },
      update: data,
    });
  }

  async findById(id: string): Promise<ReturnRequest | null> {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!returnRequest) {
      return null;
    }

    return this.toDTO(returnRequest);
  }

  async findByOrderId(orderId: string): Promise<ReturnRequest | null> {
    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: { orderId },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!returnRequest) {
      return null;
    }

    return this.toDTO(returnRequest);
  }

  async findByCreatorId(
    creatorId: string,
    filters?: ReturnFilters,
    pagination?: PaginationOptions
  ): Promise<{ returns: ReturnRequest[]; total: number }> {
    const where: Prisma.ReturnRequestWhereInput = { creatorId };

    if (filters?.status) {
      where.status = filters.status as PrismaReturnStatus;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    const [returns, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        include: { order: true },
        orderBy: { createdAt: 'desc' },
        skip: pagination?.skip ?? 0,
        take: pagination?.take ?? 20,
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return {
      returns: returns.map((r) => this.toDTO(r)),
      total,
    };
  }

  async findByCustomerId(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<{ returns: ReturnRequest[]; total: number }> {
    const where: Prisma.ReturnRequestWhereInput = { customerId };

    const [returns, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        include: { order: true },
        orderBy: { createdAt: 'desc' },
        skip: pagination?.skip ?? 0,
        take: pagination?.take ?? 20,
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return {
      returns: returns.map((r) => this.toDTO(r)),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.returnRequest.delete({ where: { id } });
  }

  private toDTO(prismaReturn: PrismaReturnRequest): ReturnRequest {
    return {
      id: prismaReturn.id,
      orderId: prismaReturn.orderId,
      orderNumber: prismaReturn.order.orderNumber,
      creatorId: prismaReturn.creatorId,
      customerId: prismaReturn.customerId,
      customerName: prismaReturn.order.customerName,
      customerEmail: prismaReturn.order.customerEmail,
      reason: prismaReturn.reason,
      reasonDetails: prismaReturn.additionalNotes ?? undefined,
      status: prismaReturn.status,
      rejectionReason: prismaReturn.rejectionReason ?? undefined,
      trackingNumber: prismaReturn.trackingNumber ?? undefined,
      carrier: prismaReturn.carrier ?? undefined,
      createdAt: prismaReturn.createdAt,
      updatedAt: prismaReturn.updatedAt,
      approvedAt: prismaReturn.approvedAt ?? undefined,
      rejectedAt: prismaReturn.rejectedAt ?? undefined,
      shippedAt: prismaReturn.shippedAt ?? undefined,
      receivedAt: prismaReturn.receivedAt ?? undefined,
      refundedAt: prismaReturn.refundedAt ?? undefined,
    };
  }
}
