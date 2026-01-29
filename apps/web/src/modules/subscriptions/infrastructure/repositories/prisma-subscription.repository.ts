import { prisma } from '@/lib/prisma/client';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../application/ports/subscription.repository.interface';
import { Plan as PrismaPlan, SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';
import { PlanType } from '../../domain/value-objects/plan.vo';
import { SubscriptionStatus } from '../../domain/entities/subscription.entity';

/**
 * Prisma implementation of SubscriptionRepository
 */
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async findById(id: string): Promise<Subscription | null> {
    const record = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const record = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findByCreatorId(creatorId: string): Promise<Subscription | null> {
    const record = await prisma.subscription.findUnique({
      where: { creatorId },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async save(subscription: Subscription): Promise<void> {
    const data = {
      userId: subscription.userId,
      creatorId: subscription.creatorId,
      plan: subscription.plan.value as PrismaPlan,
      status: subscription.status as PrismaSubscriptionStatus,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      productsUsed: subscription.productsUsed,
      salesUsed: subscription.salesUsed,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      gracePeriodStart: subscription.gracePeriodStart,
      updatedAt: subscription.updatedAt,
    };

    await prisma.subscription.upsert({
      where: { id: subscription.idString },
      create: {
        id: subscription.idString,
        ...data,
      },
      update: data,
    });
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await prisma.subscription.count({
      where: { userId },
    });

    return count > 0;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const record = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async findAllPastDue(): Promise<Subscription[]> {
    const records = await prisma.subscription.findMany({
      where: { status: 'PAST_DUE' },
    });

    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: {
    id: string;
    userId: string;
    creatorId: string;
    plan: PrismaPlan;
    status: PrismaSubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    productsUsed: number;
    salesUsed: number;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    gracePeriodStart: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    const result = Subscription.reconstitute({
      id: record.id,
      userId: record.userId,
      creatorId: record.creatorId,
      plan: record.plan as PlanType,
      status: record.status as SubscriptionStatus,
      currentPeriodStart: record.currentPeriodStart,
      currentPeriodEnd: record.currentPeriodEnd,
      productsUsed: record.productsUsed,
      salesUsed: record.salesUsed,
      stripeSubscriptionId: record.stripeSubscriptionId,
      stripeCustomerId: record.stripeCustomerId,
      gracePeriodStart: record.gracePeriodStart,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.isFailure) {
      throw new Error(`Failed to reconstitute Subscription ${record.id}: ${result.error}`);
    }

    return result.value!;
  }
}
