import { Result } from '@/shared/domain/result';
import { UseCase } from '@/shared/application/use-case.interface';
import { CreatorOnboardingRepository } from '../ports/creator-onboarding.repository.interface';

export interface ActivateCreatorAccountInput {
  userId: string;
}

export interface ActivateCreatorAccountOutput {
  message: string;
}

/**
 * User Repository Interface for role updates
 */
export interface UserRoleRepository {
  updateRole(userId: string, role: string): Promise<void>;
}

/**
 * Use Case: Activate Creator Account
 *
 * Activates a user's creator account after successful onboarding.
 * This changes their role from CLIENT to CREATOR.
 *
 * Prerequisites:
 * - SIRET must be verified
 * - Stripe must be onboarded
 */
export class ActivateCreatorAccountUseCase
  implements UseCase<ActivateCreatorAccountInput, ActivateCreatorAccountOutput>
{
  constructor(
    private readonly onboardingRepository: CreatorOnboardingRepository,
    private readonly userRepository: UserRoleRepository
  ) {}

  async execute(
    input: ActivateCreatorAccountInput
  ): Promise<Result<ActivateCreatorAccountOutput>> {
    // 1. Validate input
    if (!input.userId?.trim()) {
      return Result.fail('User ID est requis');
    }

    // 2. Get onboarding
    const onboarding = await this.onboardingRepository.findByUserId(input.userId);

    if (!onboarding) {
      return Result.fail('Onboarding non trouvé');
    }

    // 3. Verify prerequisites
    if (!onboarding.siretVerified) {
      return Result.fail("Le SIRET n'est pas vérifié");
    }

    if (!onboarding.stripeOnboarded) {
      return Result.fail("Le compte Stripe n'est pas configuré");
    }

    // 4. Update user role to CREATOR
    await this.userRepository.updateRole(input.userId, 'CREATOR');

    return Result.ok({
      message: 'Compte créateur activé avec succès',
    });
  }
}
