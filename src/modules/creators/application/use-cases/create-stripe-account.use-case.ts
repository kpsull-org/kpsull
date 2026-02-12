import { Result } from '@/shared/domain/result';
import { UseCase } from '@/shared/application/use-case.interface';
import { CreatorOnboardingRepository } from '../ports/creator-onboarding.repository.interface';
import { IStripeConnectService } from '../ports/stripe-connect.service.interface';

export interface CreateStripeAccountInput {
  userId: string;
  email: string;
}

export interface CreateStripeAccountOutput {
  stripeAccountId: string;
  onboardingUrl: string;
}

/**
 * Use Case: Create Stripe Connect Account
 *
 * Creates a new Stripe Connect Express account for a creator,
 * or generates a new account link if the account already exists.
 *
 * Prerequisites:
 * - User must be on step 3 of onboarding
 * - SIRET must be verified
 */
export class CreateStripeAccountUseCase
  implements UseCase<CreateStripeAccountInput, CreateStripeAccountOutput>
{
  constructor(
    private readonly repository: CreatorOnboardingRepository,
    private readonly stripeService: IStripeConnectService
  ) {}

  async execute(
    input: CreateStripeAccountInput
  ): Promise<Result<CreateStripeAccountOutput>> {
    // 1. Get onboarding
    const onboarding = await this.repository.findByUserId(input.userId);

    if (!onboarding) {
      return Result.fail('Onboarding non trouvé');
    }

    // 2. Validate prerequisites
    if (onboarding.currentStep.stepNumber < 3) {
      return Result.fail(
        "Vous devez d'abord compléter les étapes précédentes"
      );
    }

    if (!onboarding.siretVerified) {
      return Result.fail("Votre SIRET doit être vérifié avant de continuer");
    }

    // 3. If Stripe account already exists, create a new account link
    if (onboarding.stripeAccountId) {
      const linkResult = await this.stripeService.createAccountLink(
        onboarding.stripeAccountId
      );

      if (linkResult.isSuccess) {
        return Result.ok({
          stripeAccountId: onboarding.stripeAccountId,
          onboardingUrl: linkResult.value!,
        });
      }

      // Account link failed (e.g. mock/invalid account ID) — fall through to create a new account
      console.warn(
        `Failed to create account link for ${onboarding.stripeAccountId}, creating new account:`,
        linkResult.error
      );
    }

    // 4. Create new Stripe Connect account
    const createResult = await this.stripeService.createConnectAccount(
      input.email,
      onboarding.brandName ?? 'Créateur Kpsull'
    );

    if (createResult.isFailure) {
      return Result.fail(createResult.error!);
    }

    // 5. Save Stripe account ID to onboarding
    onboarding.setStripeAccountId(createResult.value!.accountId);
    await this.repository.save(onboarding);

    return Result.ok({
      stripeAccountId: createResult.value!.accountId,
      onboardingUrl: createResult.value!.onboardingUrl,
    });
  }
}
