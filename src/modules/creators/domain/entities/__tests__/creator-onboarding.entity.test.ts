import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreatorOnboarding,
  CreateCreatorOnboardingProps,
} from '../creator-onboarding.entity';

describe('CreatorOnboarding Entity', () => {
  const validProps: CreateCreatorOnboardingProps = {
    userId: 'user-123',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-28T10:00:00Z'));
  });

  describe('create', () => {
    it('should create a valid creator onboarding', () => {
      const result = CreatorOnboarding.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.userId).toBe('user-123');
    });

    it('should set default current step to PROFESSIONAL_INFO', () => {
      const result = CreatorOnboarding.create(validProps);

      expect(result.isSuccess).toBe(true);
      expect(result.value.currentStep.isProfessionalInfo).toBe(true);
    });

    it('should set all completion flags to false by default', () => {
      const result = CreatorOnboarding.create(validProps);
      const onboarding = result.value;

      expect(onboarding.professionalInfoCompleted).toBe(false);
      expect(onboarding.siretVerified).toBe(false);
      expect(onboarding.stripeOnboarded).toBe(false);
    });

    it('should set startedAt to current date', () => {
      const result = CreatorOnboarding.create(validProps);

      expect(result.value.startedAt).toEqual(new Date('2026-01-28T10:00:00Z'));
    });

    it('should not set completedAt', () => {
      const result = CreatorOnboarding.create(validProps);

      expect(result.value.completedAt).toBeNull();
    });

    it('should fail with empty userId', () => {
      const result = CreatorOnboarding.create({ userId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('User ID is required');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const result = CreatorOnboarding.reconstitute({
        id: 'onboarding-123',
        userId: 'user-123',
        currentStep: 'SIRET_VERIFICATION',
        professionalInfoCompleted: true,
        siretVerified: false,
        stripeOnboarded: false,
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
        stripeAccountId: null,
        startedAt: new Date('2026-01-28T10:00:00Z'),
        completedAt: null,
        updatedAt: new Date('2026-01-28T11:00:00Z'),
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.id.value).toBe('onboarding-123');
      expect(result.value.brandName).toBe('My Brand');
      expect(result.value.currentStep.isSiretVerification).toBe(true);
    });
  });

  describe('completeProfessionalInfo', () => {
    it('should complete professional info step', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      const result = onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });

      expect(result.isSuccess).toBe(true);
      expect(onboarding.professionalInfoCompleted).toBe(true);
      expect(onboarding.brandName).toBe('My Brand');
      expect(onboarding.siret).toBe('12345678901234');
      expect(onboarding.professionalAddress).toBe('123 Main St');
    });

    it('should advance to SIRET_VERIFICATION step', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });

      expect(onboarding.currentStep.isSiretVerification).toBe(true);
    });

    it('should fail if brandName is empty', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      const result = onboarding.completeProfessionalInfo({
        brandName: '',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Brand name is required');
    });

    it('should fail if siret is empty', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      const result = onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '',
        professionalAddress: '123 Main St',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('SIRET is required');
    });
  });

  describe('verifySiret', () => {
    it('should verify SIRET', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });

      const result = onboarding.verifySiret();

      expect(result.isSuccess).toBe(true);
      expect(onboarding.siretVerified).toBe(true);
    });

    it('should advance to STRIPE_CONNECT step', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });

      onboarding.verifySiret();

      expect(onboarding.currentStep.isStripeConnect).toBe(true);
    });

    it('should fail if professional info not completed', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      const result = onboarding.verifySiret();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Professional info must be completed first');
    });
  });

  describe('completeStripeOnboarding', () => {
    it('should complete stripe onboarding', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });
      onboarding.verifySiret();

      const result = onboarding.completeStripeOnboarding('acct_123');

      expect(result.isSuccess).toBe(true);
      expect(onboarding.stripeOnboarded).toBe(true);
      expect(onboarding.stripeAccountId).toBe('acct_123');
    });

    it('should set status to COMPLETED', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });
      onboarding.verifySiret();

      onboarding.completeStripeOnboarding('acct_123');

      expect(onboarding.currentStep.isCompleted).toBe(true);
    });

    it('should set completedAt', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });
      onboarding.verifySiret();

      vi.setSystemTime(new Date('2026-01-28T12:00:00Z'));
      onboarding.completeStripeOnboarding('acct_123');

      expect(onboarding.completedAt).toEqual(new Date('2026-01-28T12:00:00Z'));
    });

    it('should fail if SIRET not verified', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });

      const result = onboarding.completeStripeOnboarding('acct_123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('SIRET must be verified first');
    });

    it('should fail with empty stripe account ID', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });
      onboarding.verifySiret();

      const result = onboarding.completeStripeOnboarding('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe account ID is required');
    });
  });

  describe('isFullyCompleted', () => {
    it('should return false when not all steps completed', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      expect(onboarding.isFullyCompleted).toBe(false);
    });

    it('should return true when all steps completed', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });
      onboarding.verifySiret();
      onboarding.completeStripeOnboarding('acct_123');

      expect(onboarding.isFullyCompleted).toBe(true);
    });
  });

  describe('reconstitute - invalid step', () => {
    it('should fail with invalid onboarding step', () => {
      const result = CreatorOnboarding.reconstitute({
        id: 'onboard-1',
        userId: 'user-123',
        currentStep: 'INVALID_STEP' as never,
        professionalInfoCompleted: false,
        siretVerified: false,
        stripeOnboarded: false,
        brandName: null,
        siret: null,
        professionalAddress: null,
        stripeAccountId: null,
        startedAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getters', () => {
    it('should return updatedAt', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      expect(onboarding.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('setStripeAccountId', () => {
    it('should fail when SIRET is not verified', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;

      const result = onboarding.setStripeAccountId('acct_123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('SIRET');
    });

    it('should fail when account ID is empty', () => {
      const onboarding = CreatorOnboarding.create(validProps).value;
      onboarding.completeProfessionalInfo({
        brandName: 'My Brand',
        siret: '12345678901234',
        professionalAddress: '123 Main St',
      });
      onboarding.verifySiret();

      const result = onboarding.setStripeAccountId('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Stripe account ID');
    });
  });
});
