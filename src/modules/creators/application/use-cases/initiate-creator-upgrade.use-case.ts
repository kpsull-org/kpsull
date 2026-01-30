import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { CreatorOnboarding } from '../../domain/entities/creator-onboarding.entity';
import { CreatorOnboardingRepository } from '../ports/creator-onboarding.repository.interface';
import { CreatorOnboardingDTO } from '../dtos/creator-onboarding.dto';

/**
 * Input for InitiateCreatorUpgrade use case
 */
export interface InitiateCreatorUpgradeInput {
  userId: string;
}

/**
 * InitiateCreatorUpgrade Use Case
 *
 * Initiates the creator onboarding process for a user.
 * If an onboarding already exists, returns the existing one.
 */
export class InitiateCreatorUpgradeUseCase
  implements UseCase<InitiateCreatorUpgradeInput, CreatorOnboardingDTO>
{
  constructor(
    private readonly creatorOnboardingRepository: CreatorOnboardingRepository
  ) {}

  async execute(
    input: InitiateCreatorUpgradeInput
  ): Promise<Result<CreatorOnboardingDTO>> {
    // Validate input
    if (!input.userId || input.userId.trim() === '') {
      return Result.fail('User ID is required');
    }

    // Check if onboarding already exists
    const existingOnboarding =
      await this.creatorOnboardingRepository.findByUserId(input.userId);

    if (existingOnboarding) {
      return Result.ok(this.toDTO(existingOnboarding));
    }

    // Create new onboarding
    const onboardingResult = CreatorOnboarding.create({
      userId: input.userId,
    });

    if (onboardingResult.isFailure) {
      return Result.fail(onboardingResult.error!);
    }

    const onboarding = onboardingResult.value;

    // Save to repository
    await this.creatorOnboardingRepository.save(onboarding);

    return Result.ok(this.toDTO(onboarding));
  }

  private toDTO(onboarding: CreatorOnboarding): CreatorOnboardingDTO {
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
}
