import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivateCreatorAccountUseCase } from '../activate-creator-account.use-case';
import { CreatorOnboardingRepository } from '../../ports/creator-onboarding.repository.interface';
import { CreatorOnboarding } from '../../../domain/entities/creator-onboarding.entity';

// Mock the user repository interface
interface UserRepository {
  updateRole(userId: string, role: string): Promise<void>;
}

describe('ActivateCreatorAccountUseCase', () => {
  let useCase: ActivateCreatorAccountUseCase;
  let mockOnboardingRepository: CreatorOnboardingRepository;
  let mockUserRepository: UserRepository;

  const baseDate = new Date('2026-01-28T10:00:00Z');

  function createCompletedOnboarding(): CreatorOnboarding {
    return CreatorOnboarding.reconstitute({
      id: 'onboarding-123',
      userId: 'user-123',
      currentStep: 'COMPLETED',
      professionalInfoCompleted: true,
      siretVerified: true,
      stripeOnboarded: true,
      brandName: 'Test Brand',
      siret: '80295478500028',
      professionalAddress: '10 rue Test, 75001 Paris, France',
      stripeAccountId: 'acct_test123',
      startedAt: baseDate,
      completedAt: baseDate,
      updatedAt: baseDate,
    }).value!;
  }

  function createIncompleteOnboarding(
    overrides: Partial<{
      siretVerified: boolean;
      stripeOnboarded: boolean;
    }> = {}
  ): CreatorOnboarding {
    return CreatorOnboarding.reconstitute({
      id: 'onboarding-123',
      userId: 'user-123',
      currentStep: 'STRIPE_CONNECT',
      professionalInfoCompleted: true,
      siretVerified: overrides.siretVerified ?? false,
      stripeOnboarded: overrides.stripeOnboarded ?? false,
      brandName: 'Test Brand',
      siret: '80295478500028',
      professionalAddress: '10 rue Test, 75001 Paris, France',
      stripeAccountId: null,
      startedAt: baseDate,
      completedAt: null,
      updatedAt: baseDate,
    }).value!;
  }

  beforeEach(() => {
    mockOnboardingRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByStripeAccountId: vi.fn(),
      save: vi.fn(),
      existsByUserId: vi.fn(),
      delete: vi.fn(),
    };

    mockUserRepository = {
      updateRole: vi.fn(),
    };

    useCase = new ActivateCreatorAccountUseCase(
      mockOnboardingRepository,
      mockUserRepository
    );
  });

  it('should activate creator account successfully when all conditions are met', async () => {
    const completedOnboarding = createCompletedOnboarding();

    vi.mocked(mockOnboardingRepository.findByUserId).mockResolvedValue(
      completedOnboarding
    );
    vi.mocked(mockUserRepository.updateRole).mockResolvedValue();

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      message: 'Compte créateur activé avec succès',
    });

    expect(mockUserRepository.updateRole).toHaveBeenCalledWith(
      'user-123',
      'CREATOR'
    );
  });

  it('should fail if onboarding not found', async () => {
    vi.mocked(mockOnboardingRepository.findByUserId).mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-unknown' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Onboarding non trouvé');
  });

  it('should fail if SIRET not verified', async () => {
    const incompleteOnboarding = createIncompleteOnboarding({
      siretVerified: false,
      stripeOnboarded: true,
    });

    vi.mocked(mockOnboardingRepository.findByUserId).mockResolvedValue(
      incompleteOnboarding
    );

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Le SIRET n'est pas vérifié");
  });

  it('should fail if Stripe not onboarded', async () => {
    const incompleteOnboarding = createIncompleteOnboarding({
      siretVerified: true,
      stripeOnboarded: false,
    });

    vi.mocked(mockOnboardingRepository.findByUserId).mockResolvedValue(
      incompleteOnboarding
    );

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Le compte Stripe n'est pas configuré");
  });

  it('should fail if both SIRET and Stripe not complete', async () => {
    const incompleteOnboarding = createIncompleteOnboarding({
      siretVerified: false,
      stripeOnboarded: false,
    });

    vi.mocked(mockOnboardingRepository.findByUserId).mockResolvedValue(
      incompleteOnboarding
    );

    const result = await useCase.execute({ userId: 'user-123' });

    expect(result.isFailure).toBe(true);
    // Should fail on first check (SIRET)
    expect(result.error).toBe("Le SIRET n'est pas vérifié");
  });
});
