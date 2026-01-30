import type { CreatorOnboarding as PrismaCreatorOnboarding, $Enums } from '@prisma/client';
import { CreatorOnboarding } from '../../domain/entities/creator-onboarding.entity';
import { OnboardingStepType } from '../../domain/value-objects/onboarding-step.vo';

type PrismaOnboardingStep = $Enums.OnboardingStep;

/**
 * Mapper for CreatorOnboarding between domain and persistence
 */
export class CreatorOnboardingMapper {
  /**
   * Maps a Prisma CreatorOnboarding to domain entity
   */
  static toDomain(
    prismaOnboarding: PrismaCreatorOnboarding
  ): CreatorOnboarding | null {
    const result = CreatorOnboarding.reconstitute({
      id: prismaOnboarding.id,
      userId: prismaOnboarding.userId,
      currentStep: this.mapPrismaStepToDomain(prismaOnboarding.currentStep),
      professionalInfoCompleted: prismaOnboarding.professionalInfoCompleted,
      siretVerified: prismaOnboarding.siretVerified,
      stripeOnboarded: prismaOnboarding.stripeOnboarded,
      brandName: prismaOnboarding.brandName,
      siret: prismaOnboarding.siret,
      professionalAddress: prismaOnboarding.professionalAddress,
      stripeAccountId: prismaOnboarding.stripeAccountId,
      startedAt: prismaOnboarding.startedAt,
      completedAt: prismaOnboarding.completedAt,
      updatedAt: prismaOnboarding.updatedAt,
    });

    if (result.isFailure) {
      return null;
    }

    return result.value;
  }

  /**
   * Maps a domain CreatorOnboarding to Prisma data for creation
   */
  static toPrismaCreate(onboarding: CreatorOnboarding): {
    id: string;
    userId: string;
    currentStep: PrismaOnboardingStep;
    professionalInfoCompleted: boolean;
    siretVerified: boolean;
    stripeOnboarded: boolean;
    brandName: string | null;
    siret: string | null;
    professionalAddress: string | null;
    stripeAccountId: string | null;
    startedAt: Date;
    completedAt: Date | null;
  } {
    return {
      id: onboarding.id.value,
      userId: onboarding.userId,
      currentStep: this.mapDomainStepToPrisma(onboarding.currentStep.value),
      professionalInfoCompleted: onboarding.professionalInfoCompleted,
      siretVerified: onboarding.siretVerified,
      stripeOnboarded: onboarding.stripeOnboarded,
      brandName: onboarding.brandName,
      siret: onboarding.siret,
      professionalAddress: onboarding.professionalAddress,
      stripeAccountId: onboarding.stripeAccountId,
      startedAt: onboarding.startedAt,
      completedAt: onboarding.completedAt,
    };
  }

  /**
   * Maps a domain CreatorOnboarding to Prisma data for update
   */
  static toPrismaUpdate(onboarding: CreatorOnboarding): {
    currentStep: PrismaOnboardingStep;
    professionalInfoCompleted: boolean;
    siretVerified: boolean;
    stripeOnboarded: boolean;
    brandName: string | null;
    siret: string | null;
    professionalAddress: string | null;
    stripeAccountId: string | null;
    completedAt: Date | null;
  } {
    return {
      currentStep: this.mapDomainStepToPrisma(onboarding.currentStep.value),
      professionalInfoCompleted: onboarding.professionalInfoCompleted,
      siretVerified: onboarding.siretVerified,
      stripeOnboarded: onboarding.stripeOnboarded,
      brandName: onboarding.brandName,
      siret: onboarding.siret,
      professionalAddress: onboarding.professionalAddress,
      stripeAccountId: onboarding.stripeAccountId,
      completedAt: onboarding.completedAt,
    };
  }

  private static mapPrismaStepToDomain(
    step: PrismaOnboardingStep
  ): OnboardingStepType {
    const mapping: Record<PrismaOnboardingStep, OnboardingStepType> = {
      PROFESSIONAL_INFO: 'PROFESSIONAL_INFO',
      SIRET_VERIFICATION: 'SIRET_VERIFICATION',
      STRIPE_CONNECT: 'STRIPE_CONNECT',
      COMPLETED: 'COMPLETED',
    };
    return mapping[step];
  }

  private static mapDomainStepToPrisma(
    step: OnboardingStepType
  ): PrismaOnboardingStep {
    const mapping: Record<OnboardingStepType, PrismaOnboardingStep> = {
      PROFESSIONAL_INFO: 'PROFESSIONAL_INFO',
      SIRET_VERIFICATION: 'SIRET_VERIFICATION',
      STRIPE_CONNECT: 'STRIPE_CONNECT',
      COMPLETED: 'COMPLETED',
    };
    return mapping[step];
  }
}
