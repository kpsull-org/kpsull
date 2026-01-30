import { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import { CreatorOnboardingRepository } from '../ports/creator-onboarding.repository.interface';
import {
  ISiretVerificationService,
  SiretVerificationResult,
  VerificationStatus,
} from '../ports/siret-verification.service.interface';

/**
 * Input for VerifySiret use case
 */
export interface VerifySiretInput {
  userId: string;
}

/**
 * Output for VerifySiret use case
 */
export interface VerifySiretOutput {
  status: VerificationStatus;
  companyInfo?: SiretVerificationResult;
  message?: string;
  canContinue: boolean;
}

/**
 * VerifySiret Use Case
 *
 * Verifies a SIRET number via the data.gouv.fr Sirene API and updates the onboarding status.
 *
 * Handles three scenarios:
 * 1. VERIFIED - SIRET is valid and active, proceed to next step
 * 2. INVALID - SIRET not found or inactive, show error
 * 3. PENDING_MANUAL - API timeout, allow continuation with manual verification pending
 */
export class VerifySiretUseCase
  implements UseCase<VerifySiretInput, VerifySiretOutput>
{
  constructor(
    private readonly creatorOnboardingRepository: CreatorOnboardingRepository,
    private readonly siretVerificationService: ISiretVerificationService
  ) {}

  async execute(input: VerifySiretInput): Promise<Result<VerifySiretOutput>> {
    // Validate input
    if (!input.userId || input.userId.trim() === '') {
      return Result.fail('User ID is required');
    }

    // Find onboarding
    const onboarding = await this.creatorOnboardingRepository.findByUserId(
      input.userId
    );

    if (!onboarding) {
      return Result.fail('Onboarding non trouvé');
    }

    // Check professional info is completed
    if (!onboarding.professionalInfoCompleted || !onboarding.siret) {
      return Result.fail('Professional info must be completed first');
    }

    // Verify SIRET via service
    const verificationResult = await this.siretVerificationService.verifySiret(
      onboarding.siret
    );

    // Handle timeout - allow continuation with manual verification
    const isServiceUnavailable =
      verificationResult.isFailure &&
      (verificationResult.error?.includes('temporairement indisponible') ||
       verificationResult.error?.includes('Trop de requêtes'));

    if (isServiceUnavailable) {
      // Still advance to next step, but SIRET not verified
      // Admin will need to verify manually
      const verifySiretResult = onboarding.verifySiret();
      if (verifySiretResult.isSuccess) {
        await this.creatorOnboardingRepository.save(onboarding);
      }

      return Result.ok({
        status: 'PENDING_MANUAL',
        message:
          "Le service de vérification est temporairement indisponible. Votre SIRET sera vérifié manuellement.",
        canContinue: true,
      });
    }

    // Handle verification failure
    if (verificationResult.isFailure) {
      return Result.fail(verificationResult.error!);
    }

    // SIRET verified successfully - update onboarding
    const verifySiretResult = onboarding.verifySiret();
    if (verifySiretResult.isFailure) {
      return Result.fail(verifySiretResult.error!);
    }

    await this.creatorOnboardingRepository.save(onboarding);

    return Result.ok({
      status: 'VERIFIED',
      companyInfo: verificationResult.value,
      canContinue: true,
    });
  }
}
