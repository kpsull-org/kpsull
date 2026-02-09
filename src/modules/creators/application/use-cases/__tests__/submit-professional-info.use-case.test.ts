import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmitProfessionalInfoUseCase, SubmitProfessionalInfoInput } from '../submit-professional-info.use-case';
import { CreatorOnboardingRepository } from '../../ports/creator-onboarding.repository.interface';
import { CreatorOnboarding } from '../../../domain/entities/creator-onboarding.entity';

// Valid test data
const VALID_SIRET = '87869129400010';
const VALID_INPUT: SubmitProfessionalInfoInput = {
  userId: 'user-123',
  brandName: 'Ma Marque',
  siret: VALID_SIRET,
  street: '10 rue de la Paix',
  city: 'Paris',
  postalCode: '75001',
};

describe('SubmitProfessionalInfo Use Case', () => {
  let useCase: SubmitProfessionalInfoUseCase;
  let mockRepository: CreatorOnboardingRepository;
  let mockOnboarding: CreatorOnboarding;

  beforeEach(() => {
    // Create a real onboarding entity for testing
    mockOnboarding = CreatorOnboarding.create({ userId: 'user-123' }).value;

    mockRepository = {
      findByUserId: vi.fn().mockResolvedValue(mockOnboarding),
      findById: vi.fn(),
      findByStripeAccountId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      existsByUserId: vi.fn().mockResolvedValue(false),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    useCase = new SubmitProfessionalInfoUseCase(mockRepository);
  });

  describe('successful submission', () => {
    it('should complete professional info step with valid data', async () => {
      const result = await useCase.execute(VALID_INPUT);

      expect(result.isSuccess).toBe(true);
      expect(result.value.professionalInfoCompleted).toBe(true);
      expect(result.value.currentStep).toBe('SIRET_VERIFICATION');
    });

    it('should save updated onboarding', async () => {
      await useCase.execute(VALID_INPUT);

      expect(mockRepository.save).toHaveBeenCalledWith(mockOnboarding);
    });

    it('should store brand name', async () => {
      const result = await useCase.execute(VALID_INPUT);

      expect(result.value.brandName).toBe('Ma Marque');
    });

    it('should store normalized SIRET', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        siret: '878 691 294 00010', // With spaces
      });

      expect(result.value.siret).toBe(VALID_SIRET);
    });

    it('should store formatted professional address', async () => {
      const result = await useCase.execute(VALID_INPUT);

      expect(result.value.professionalAddress).toBe('10 rue de la Paix, 75001 Paris, France');
    });
  });

  describe('validation errors', () => {
    it('should fail when user ID is empty', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        userId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID');
    });

    it('should fail when onboarding not found', async () => {
      mockRepository.findByUserId = vi.fn().mockResolvedValue(null);

      const result = await useCase.execute(VALID_INPUT);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when brand name is empty', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        brandName: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('marque');
    });

    it('should fail when brand name exceeds max length', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        brandName: 'A'.repeat(101),
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('100 caractères');
    });

    it('should fail when SIRET is invalid (wrong length)', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        siret: '1234567890', // Only 10 digits
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('14 chiffres');
    });

    it('should fail when SIRET checksum is invalid', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        siret: '12345678901235', // Invalid checksum
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should fail when street is empty', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        street: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('adresse');
    });

    it('should fail when city is empty', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        city: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('ville');
    });

    it('should fail when postal code is invalid', async () => {
      const result = await useCase.execute({
        ...VALID_INPUT,
        postalCode: '7500', // Only 4 digits
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('5 chiffres');
    });
  });

  describe('step progression', () => {
    it('should advance to SIRET_VERIFICATION step', async () => {
      const result = await useCase.execute(VALID_INPUT);

      expect(result.isSuccess).toBe(true);
      expect(result.value.stepNumber).toBe(2);
    });
  });
});
