import { describe, it, expect } from 'vitest';
import { OnboardingStep, OnboardingStepType } from '../onboarding-step.vo';

describe('OnboardingStep Value Object', () => {
  describe('create', () => {
    it('should create a valid onboarding step for PROFESSIONAL_INFO', () => {
      const result = OnboardingStep.create('PROFESSIONAL_INFO');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('PROFESSIONAL_INFO');
    });

    it('should create a valid onboarding step for SIRET_VERIFICATION', () => {
      const result = OnboardingStep.create('SIRET_VERIFICATION');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('SIRET_VERIFICATION');
    });

    it('should create a valid onboarding step for STRIPE_CONNECT', () => {
      const result = OnboardingStep.create('STRIPE_CONNECT');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('STRIPE_CONNECT');
    });

    it('should create a valid onboarding step for COMPLETED', () => {
      const result = OnboardingStep.create('COMPLETED');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('COMPLETED');
    });

    it('should fail with invalid step', () => {
      const result = OnboardingStep.create('INVALID' as OnboardingStepType);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Invalid onboarding step');
    });
  });

  describe('step properties', () => {
    it('should correctly identify professional info step', () => {
      const result = OnboardingStep.create('PROFESSIONAL_INFO');
      const step = result.value;

      expect(step.isProfessionalInfo).toBe(true);
      expect(step.isSiretVerification).toBe(false);
      expect(step.isStripeConnect).toBe(false);
      expect(step.isCompleted).toBe(false);
    });

    it('should correctly identify siret verification step', () => {
      const result = OnboardingStep.create('SIRET_VERIFICATION');
      const step = result.value;

      expect(step.isProfessionalInfo).toBe(false);
      expect(step.isSiretVerification).toBe(true);
      expect(step.isStripeConnect).toBe(false);
      expect(step.isCompleted).toBe(false);
    });

    it('should correctly identify stripe connect step', () => {
      const result = OnboardingStep.create('STRIPE_CONNECT');
      const step = result.value;

      expect(step.isProfessionalInfo).toBe(false);
      expect(step.isSiretVerification).toBe(false);
      expect(step.isStripeConnect).toBe(true);
      expect(step.isCompleted).toBe(false);
    });

    it('should correctly identify completed step', () => {
      const result = OnboardingStep.create('COMPLETED');
      const step = result.value;

      expect(step.isProfessionalInfo).toBe(false);
      expect(step.isSiretVerification).toBe(false);
      expect(step.isStripeConnect).toBe(false);
      expect(step.isCompleted).toBe(true);
    });
  });

  describe('step number', () => {
    it('should return correct step number for PROFESSIONAL_INFO', () => {
      const result = OnboardingStep.create('PROFESSIONAL_INFO');
      expect(result.value.stepNumber).toBe(1);
    });

    it('should return correct step number for SIRET_VERIFICATION', () => {
      const result = OnboardingStep.create('SIRET_VERIFICATION');
      expect(result.value.stepNumber).toBe(2);
    });

    it('should return correct step number for STRIPE_CONNECT', () => {
      const result = OnboardingStep.create('STRIPE_CONNECT');
      expect(result.value.stepNumber).toBe(3);
    });

    it('should return correct step number for COMPLETED', () => {
      const result = OnboardingStep.create('COMPLETED');
      expect(result.value.stepNumber).toBe(4);
    });
  });

  describe('default', () => {
    it('should return PROFESSIONAL_INFO as default step', () => {
      const step = OnboardingStep.default();

      expect(step.value).toBe('PROFESSIONAL_INFO');
      expect(step.isProfessionalInfo).toBe(true);
    });
  });
});
