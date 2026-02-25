import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  InitiateCreatorUpgradeUseCase,
  InitiateCreatorUpgradeInput,
} from '../initiate-creator-upgrade.use-case';
import { CreatorOnboardingRepository } from '../../ports/creator-onboarding.repository.interface';
import { CreatorOnboarding } from '../../../domain/entities/creator-onboarding.entity';
import { Result } from '@/shared/domain/result';

describe('InitiateCreatorUpgradeUseCase', () => {
  let useCase: InitiateCreatorUpgradeUseCase;
  let mockRepository: CreatorOnboardingRepository;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-28T10:00:00Z'));

    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByStripeAccountId: vi.fn(),
      save: vi.fn(),
      existsByUserId: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new InitiateCreatorUpgradeUseCase(mockRepository);
  });

  const validInput: InitiateCreatorUpgradeInput = {
    userId: 'user-123',
  };

  describe('execute', () => {
    it('should create a new onboarding for a user without existing onboarding', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBe('user-123');
      expect(result.value.currentStep).toBe('PROFESSIONAL_INFO');
      expect(result.value.stepNumber).toBe(1);
    });

    it('should return existing onboarding if already started', async () => {
      const existingOnboarding = CreatorOnboarding.create({ userId: 'user-123' }).value;
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(existingOnboarding);

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBe('user-123');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should save the onboarding when creating new one', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      await useCase.execute(validInput);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should fail with empty userId', async () => {
      const result = await useCase.execute({ userId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID is required');
    });

    it('should return correct DTO structure', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await useCase.execute(validInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toMatchObject({
        userId: 'user-123',
        currentStep: 'PROFESSIONAL_INFO',
        stepNumber: 1,
        professionalInfoCompleted: false,
        siretVerified: false,
        stripeOnboarded: false,
        brandName: null,
        siret: null,
        professionalAddress: null,
        stripeAccountId: null,
        isFullyCompleted: false,
      });
    });

    it('should include startedAt in response', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.save).mockResolvedValue(undefined);

      const result = await useCase.execute(validInput);

      expect(result.value.startedAt).toEqual(new Date('2026-01-28T10:00:00Z'));
    });

    it('should fail when CreatorOnboarding.create returns a failure', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.spyOn(CreatorOnboarding, 'create').mockReturnValue(
        Result.fail('Creation failed') as ReturnType<typeof CreatorOnboarding.create>
      );

      const result = await useCase.execute(validInput);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Creation failed');
    });
  });
});
