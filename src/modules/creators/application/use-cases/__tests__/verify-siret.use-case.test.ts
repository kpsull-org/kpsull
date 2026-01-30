import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerifySiretUseCase, VerifySiretInput } from '../verify-siret.use-case';
import { CreatorOnboardingRepository } from '../../ports/creator-onboarding.repository.interface';
import { ISiretVerificationService, SiretVerificationResult } from '../../ports/siret-verification.service.interface';
import { CreatorOnboarding } from '../../../domain/entities/creator-onboarding.entity';
import { Result } from '@/shared/domain/result';

const VALID_SIRET = '80295478500028';
const VALID_INPUT: VerifySiretInput = {
  userId: 'user-123',
};

const VALID_VERIFICATION_RESULT: SiretVerificationResult = {
  isValid: true,
  isActive: true,
  companyName: 'MA SUPER ENTREPRISE',
  legalForm: '5499',
  address: {
    street: '10 RUE DE LA PAIX',
    postalCode: '75001',
    city: 'PARIS',
  },
  activityCode: '62.01Z',
  creationDate: new Date('2020-01-15'),
};

describe('VerifySiret Use Case', () => {
  let useCase: VerifySiretUseCase;
  let mockRepository: CreatorOnboardingRepository;
  let mockSiretService: ISiretVerificationService;
  let mockOnboarding: CreatorOnboarding;

  beforeEach(() => {
    // Create onboarding with professional info completed
    mockOnboarding = CreatorOnboarding.create({ userId: 'user-123' }).value;
    mockOnboarding.completeProfessionalInfo({
      brandName: 'Test Brand',
      siret: VALID_SIRET,
      professionalAddress: '10 rue Test, 75001 Paris, France',
    });

    mockRepository = {
      findByUserId: vi.fn().mockResolvedValue(mockOnboarding),
      findById: vi.fn(),
      findByStripeAccountId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      existsByUserId: vi.fn().mockResolvedValue(false),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockSiretService = {
      verifySiret: vi.fn().mockResolvedValue(Result.ok(VALID_VERIFICATION_RESULT)),
    };

    useCase = new VerifySiretUseCase(mockRepository, mockSiretService);
  });

  describe('successful verification', () => {
    it('should verify SIRET and return company info', async () => {
      const result = await useCase.execute(VALID_INPUT);

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('VERIFIED');
      expect(result.value.companyInfo).toBeDefined();
      expect(result.value.companyInfo?.companyName).toBe('MA SUPER ENTREPRISE');
      expect(result.value.canContinue).toBe(true);
    });

    it('should call SIRET service with correct SIRET', async () => {
      await useCase.execute(VALID_INPUT);

      expect(mockSiretService.verifySiret).toHaveBeenCalledWith(VALID_SIRET);
    });

    it('should mark onboarding as SIRET verified', async () => {
      await useCase.execute(VALID_INPUT);

      expect(mockOnboarding.siretVerified).toBe(true);
    });

    it('should advance to STRIPE_CONNECT step', async () => {
      await useCase.execute(VALID_INPUT);

      expect(mockOnboarding.currentStep.value).toBe('STRIPE_CONNECT');
    });

    it('should save updated onboarding', async () => {
      await useCase.execute(VALID_INPUT);

      expect(mockRepository.save).toHaveBeenCalledWith(mockOnboarding);
    });
  });

  describe('validation errors', () => {
    it('should fail when user ID is empty', async () => {
      const result = await useCase.execute({ userId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when onboarding not found', async () => {
      mockRepository.findByUserId = vi.fn().mockResolvedValue(null);

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when professional info not completed', async () => {
      // Fresh onboarding without professional info
      mockOnboarding = CreatorOnboarding.create({ userId: 'user-123' }).value;
      mockRepository.findByUserId = vi.fn().mockResolvedValue(mockOnboarding);

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Professional info');
    });
  });

  describe('SIRET verification failure', () => {
    it('should fail when SIRET not found in registry', async () => {
      mockSiretService.verifySiret = vi
        .fn()
        .mockResolvedValue(Result.fail('SIRET non trouvé dans la base INSEE'));

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when establishment is inactive', async () => {
      mockSiretService.verifySiret = vi
        .fn()
        .mockResolvedValue(Result.fail("Cet établissement n'est plus actif"));

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('plus actif');
    });
  });

  describe('timeout handling (fallback)', () => {
    it('should return PENDING_MANUAL status on timeout', async () => {
      mockSiretService.verifySiret = vi
        .fn()
        .mockResolvedValue(Result.fail('Le service est temporairement indisponible. Veuillez réessayer.'));

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('PENDING_MANUAL');
      expect(result.value.canContinue).toBe(true);
      expect(result.value.message).toContain('indisponible');
    });

    it('should still allow continuation on rate limit', async () => {
      mockSiretService.verifySiret = vi
        .fn()
        .mockResolvedValue(Result.fail('Trop de requêtes. Veuillez réessayer dans quelques secondes.'));

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isSuccess).toBe(true);
      expect(result.value.canContinue).toBe(true);
    });

    it('should save onboarding with pending status on timeout', async () => {
      mockSiretService.verifySiret = vi
        .fn()
        .mockResolvedValue(Result.fail('Le service est temporairement indisponible. Veuillez réessayer.'));

      await useCase.execute(VALID_INPUT);

      // Should still advance to next step for manual verification
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
