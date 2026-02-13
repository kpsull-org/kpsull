import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateStripeAccountUseCase } from '../create-stripe-account.use-case';
import { CreatorOnboardingRepository } from '../../ports/creator-onboarding.repository.interface';
import { IStripeConnectService } from '../../ports/stripe-connect.service.interface';
import { CreatorOnboarding } from '../../../domain/entities/creator-onboarding.entity';
import { Result } from '@/shared/domain/result';

describe('CreateStripeAccountUseCase', () => {
  let useCase: CreateStripeAccountUseCase;
  let mockRepository: CreatorOnboardingRepository;
  let mockStripeService: IStripeConnectService;

  const baseDate = new Date('2026-01-28T10:00:00Z');

  function createOnboardingAtStep3(
    overrides: Partial<{
      stripeAccountId: string | null;
      siretVerified: boolean;
      brandName: string | null;
    }> = {}
  ): CreatorOnboarding {
    return CreatorOnboarding.reconstitute({
      id: 'onboarding-123',
      userId: 'user-123',
      currentStep: 'STRIPE_CONNECT',
      professionalInfoCompleted: true,
      siretVerified: overrides.siretVerified ?? true,
      stripeOnboarded: false,
      brandName: overrides.brandName ?? 'Test Brand',
      siret: '80295478500028',
      professionalAddress: '10 rue Test, 75001 Paris, France',
      stripeAccountId: overrides.stripeAccountId ?? null,
      startedAt: baseDate,
      completedAt: null,
      updatedAt: baseDate,
    }).value;
  }

  function createOnboardingAtStep2(): CreatorOnboarding {
    return CreatorOnboarding.reconstitute({
      id: 'onboarding-123',
      userId: 'user-123',
      currentStep: 'SIRET_VERIFICATION',
      professionalInfoCompleted: true,
      siretVerified: false,
      stripeOnboarded: false,
      brandName: 'Test Brand',
      siret: '80295478500028',
      professionalAddress: '10 rue Test, 75001 Paris, France',
      stripeAccountId: null,
      startedAt: baseDate,
      completedAt: null,
      updatedAt: baseDate,
    }).value;
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByStripeAccountId: vi.fn(),
      save: vi.fn(),
      existsByUserId: vi.fn(),
      delete: vi.fn(),
    };

    mockStripeService = {
      createConnectAccount: vi.fn(),
      createAccountLink: vi.fn(),
      checkAccountStatus: vi.fn(),
    };

    useCase = new CreateStripeAccountUseCase(mockRepository, mockStripeService);
  });

  it('should create a new Stripe account successfully', async () => {
    const onboardingEntity = createOnboardingAtStep3();

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(onboardingEntity);
    vi.mocked(mockStripeService.createConnectAccount).mockResolvedValue(
      Result.ok({
        accountId: 'acct_new123',
        onboardingUrl: 'https://stripe.com/onboarding',
      })
    );
    vi.mocked(mockRepository.save).mockResolvedValue();

    const result = await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      stripeAccountId: 'acct_new123',
      onboardingUrl: 'https://stripe.com/onboarding',
    });

    expect(mockStripeService.createConnectAccount).toHaveBeenCalledWith(
      'test@example.com',
      'Test Brand'
    );
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should return existing account link if Stripe account already exists', async () => {
    const onboardingWithStripe = createOnboardingAtStep3({
      stripeAccountId: 'acct_existing123',
    });

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(
      onboardingWithStripe
    );
    vi.mocked(mockStripeService.createAccountLink).mockResolvedValue(
      Result.ok('https://stripe.com/continue-onboarding')
    );

    const result = await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      stripeAccountId: 'acct_existing123',
      onboardingUrl: 'https://stripe.com/continue-onboarding',
    });

    expect(mockStripeService.createConnectAccount).not.toHaveBeenCalled();
    expect(mockStripeService.createAccountLink).toHaveBeenCalledWith(
      'acct_existing123'
    );
  });

  it('should fail if onboarding not found', async () => {
    vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-unknown',
      email: 'test@example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Onboarding non trouvé');
  });

  it('should fail if not on step 3', async () => {
    const onboardingStep2 = createOnboardingAtStep2();

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(onboardingStep2);

    const result = await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(
      "Vous devez d'abord compléter les étapes précédentes"
    );
  });

  it('should fail if SIRET not verified', async () => {
    const onboardingUnverified = createOnboardingAtStep3({
      siretVerified: false,
    });

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(
      onboardingUnverified
    );

    const result = await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Votre SIRET doit être vérifié avant de continuer");
  });

  it('should fail if Stripe service returns error', async () => {
    const onboardingEntity = createOnboardingAtStep3();

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(onboardingEntity);
    vi.mocked(mockStripeService.createConnectAccount).mockResolvedValue(
      Result.fail('Stripe error')
    );

    const result = await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Stripe error');
  });

  it('should fail if account link creation fails and new account creation also fails', async () => {
    const onboardingWithStripe = createOnboardingAtStep3({
      stripeAccountId: 'acct_existing123',
    });

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(
      onboardingWithStripe
    );
    vi.mocked(mockStripeService.createAccountLink).mockResolvedValue(
      Result.fail('Link creation failed')
    );
    vi.mocked(mockStripeService.createConnectAccount).mockResolvedValue(
      Result.fail('Account creation failed')
    );

    const result = await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Account creation failed');
  });

  it('should use default brand name if not set', async () => {
    // Create onboarding with null brandName directly
    const onboardingNoBrand = CreatorOnboarding.reconstitute({
      id: 'onboarding-123',
      userId: 'user-123',
      currentStep: 'STRIPE_CONNECT',
      professionalInfoCompleted: true,
      siretVerified: true,
      stripeOnboarded: false,
      brandName: null,
      siret: '80295478500028',
      professionalAddress: '10 rue Test, 75001 Paris, France',
      stripeAccountId: null,
      startedAt: baseDate,
      completedAt: null,
      updatedAt: baseDate,
    }).value;

    vi.mocked(mockRepository.findByUserId).mockResolvedValue(onboardingNoBrand);
    vi.mocked(mockStripeService.createConnectAccount).mockResolvedValue(
      Result.ok({
        accountId: 'acct_new123',
        onboardingUrl: 'https://stripe.com/onboarding',
      })
    );
    vi.mocked(mockRepository.save).mockResolvedValue();

    await useCase.execute({
      userId: 'user-123',
      email: 'test@example.com',
    });

    expect(mockStripeService.createConnectAccount).toHaveBeenCalledWith(
      'test@example.com',
      'Créateur Kpsull'
    );
  });
});
