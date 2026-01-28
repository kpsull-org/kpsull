import { prisma } from '@/lib/prisma/client';
import { CreatorOnboarding } from '../../domain/entities/creator-onboarding.entity';
import { CreatorOnboardingRepository } from '../../application/ports/creator-onboarding.repository.interface';
import { CreatorOnboardingMapper } from '../mappers/creator-onboarding.mapper';

/**
 * Prisma implementation of the CreatorOnboardingRepository port
 */
export class PrismaCreatorOnboardingRepository
  implements CreatorOnboardingRepository
{
  /**
   * Finds a creator onboarding by its unique ID
   */
  async findById(id: string): Promise<CreatorOnboarding | null> {
    const prismaOnboarding = await prisma.creatorOnboarding.findUnique({
      where: { id },
    });

    if (!prismaOnboarding) {
      return null;
    }

    return CreatorOnboardingMapper.toDomain(prismaOnboarding);
  }

  /**
   * Finds a creator onboarding by user ID
   */
  async findByUserId(userId: string): Promise<CreatorOnboarding | null> {
    const prismaOnboarding = await prisma.creatorOnboarding.findUnique({
      where: { userId },
    });

    if (!prismaOnboarding) {
      return null;
    }

    return CreatorOnboardingMapper.toDomain(prismaOnboarding);
  }

  /**
   * Saves a creator onboarding (creates or updates)
   */
  async save(onboarding: CreatorOnboarding): Promise<void> {
    const existing = await prisma.creatorOnboarding.findUnique({
      where: { id: onboarding.id.value },
    });

    if (existing) {
      const updateData = CreatorOnboardingMapper.toPrismaUpdate(onboarding);
      await prisma.creatorOnboarding.update({
        where: { id: onboarding.id.value },
        data: updateData,
      });
    } else {
      const createData = CreatorOnboardingMapper.toPrismaCreate(onboarding);
      await prisma.creatorOnboarding.create({
        data: createData,
      });
    }
  }

  /**
   * Checks if a user already has an onboarding record
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const count = await prisma.creatorOnboarding.count({
      where: { userId },
    });

    return count > 0;
  }

  /**
   * Deletes a creator onboarding by ID
   */
  async delete(id: string): Promise<void> {
    await prisma.creatorOnboarding.delete({
      where: { id },
    });
  }

  /**
   * Finds a creator onboarding by Stripe account ID
   */
  async findByStripeAccountId(
    stripeAccountId: string
  ): Promise<CreatorOnboarding | null> {
    const prismaOnboarding = await prisma.creatorOnboarding.findFirst({
      where: { stripeAccountId },
    });

    if (!prismaOnboarding) {
      return null;
    }

    return CreatorOnboardingMapper.toDomain(prismaOnboarding);
  }
}
