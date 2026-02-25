import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { CreatorOnboardingRepository } from '../ports/creator-onboarding.repository.interface';
import { CreatorOnboardingDTO } from '../dtos/creator-onboarding.dto';
import { Siret } from '../../domain/value-objects/siret.vo';
import { ProfessionalAddress } from '../../domain/value-objects/professional-address.vo';
import { CreatorOnboarding } from '../../domain/entities/creator-onboarding.entity';

const MAX_BRAND_NAME_LENGTH = 100;

/**
 * Input for SubmitProfessionalInfo use case
 */
export interface SubmitProfessionalInfoInput {
  userId: string;
  brandName: string;
  siret: string;
  street: string;
  city: string;
  postalCode: string;
  country?: string;
}

/**
 * SubmitProfessionalInfo Use Case
 *
 * Submits professional information for the creator onboarding process.
 * Validates all inputs using domain value objects before saving.
 */
export class SubmitProfessionalInfoUseCase
  implements UseCase<SubmitProfessionalInfoInput, CreatorOnboardingDTO>
{
  constructor(
    private readonly creatorOnboardingRepository: CreatorOnboardingRepository
  ) {}

  async execute(
    input: SubmitProfessionalInfoInput
  ): Promise<Result<CreatorOnboardingDTO>> {
    // Validate user ID
    if (!input.userId || input.userId.trim() === '') {
      return Result.fail('User ID is required');
    }

    // Validate brand name
    const brandNameValidation = this.validateBrandName(input.brandName);
    if (brandNameValidation.isFailure) {
      return Result.fail(brandNameValidation.error!);
    }

    // Validate SIRET using Value Object
    const siretResult = Siret.create(input.siret);
    if (siretResult.isFailure) {
      return Result.fail(siretResult.error!);
    }

    // Validate Address using Value Object
    const addressResult = ProfessionalAddress.create({
      street: input.street,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country,
    });
    if (addressResult.isFailure) {
      return Result.fail(addressResult.error!);
    }

    // Find onboarding
    const onboarding = await this.creatorOnboardingRepository.findByUserId(
      input.userId
    );

    if (!onboarding) {
      return Result.fail('Onboarding non trouvé');
    }

    // Complete professional info with validated data
    const completionResult = onboarding.completeProfessionalInfo({
      brandName: input.brandName.trim(),
      siret: siretResult.value.value, // Store normalized SIRET
      professionalAddress: addressResult.value.formatted, // Store formatted address
    });

    /* c8 ignore start */
    if (completionResult.isFailure) {
      return Result.fail(completionResult.error!);
    }
    /* c8 ignore stop */

    // Save to repository
    await this.creatorOnboardingRepository.save(onboarding);

    return Result.ok(this.toDTO(onboarding));
  }

  private validateBrandName(brandName: string): Result<void> {
    if (!brandName || brandName.trim() === '') {
      return Result.fail('Le nom de marque est requis');
    }

    if (brandName.length > MAX_BRAND_NAME_LENGTH) {
      return Result.fail(
        `Le nom de marque ne peut pas dépasser ${MAX_BRAND_NAME_LENGTH} caractères`
      );
    }

    return Result.ok(undefined);
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
