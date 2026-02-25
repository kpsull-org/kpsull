import { CreatorOnboarding } from '../../domain/entities/creator-onboarding.entity';
import { CreatorOnboardingDTO } from '../dtos/creator-onboarding.dto';

export function toCreatorOnboardingDTO(onboarding: CreatorOnboarding): CreatorOnboardingDTO {
  return {
    id: onboarding.id.value,
    userId: onboarding.userId,
    currentStep: onboarding.currentStep.value,
    stepNumber: onboarding.currentStep.stepNumber,
    professionalInfoCompleted: onboarding.professionalInfoCompleted,
    siretVerified: onboarding.siretVerified,
    stripeOnboarded: onboarding.stripeOnboarded,
    brandName: onboarding.brandName,
    siret: onboarding.siret,
    professionalAddress: onboarding.professionalAddress,
    stripeAccountId: onboarding.stripeAccountId,
    startedAt: onboarding.startedAt,
    completedAt: onboarding.completedAt,
    isFullyCompleted: onboarding.isFullyCompleted,
  };
}
