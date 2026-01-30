import { describe, it, expect } from 'vitest';
import { Plan, PlanType } from '../plan.vo';

describe('Plan Value Object', () => {
  describe('create', () => {
    it('should create ESSENTIEL plan', () => {
      const result = Plan.create('ESSENTIEL');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('ESSENTIEL');
    });

    it('should create STUDIO plan', () => {
      const result = Plan.create('STUDIO');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('STUDIO');
    });

    it('should create ATELIER plan', () => {
      const result = Plan.create('ATELIER');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('ATELIER');
    });

    it('should fail with invalid plan type', () => {
      const result = Plan.create('INVALID' as PlanType);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Plan invalide');
    });
  });

  describe('isEssentiel', () => {
    it('should return true for ESSENTIEL plan', () => {
      const plan = Plan.create('ESSENTIEL').value!;

      expect(plan.isEssentiel).toBe(true);
    });

    it('should return false for other plans', () => {
      expect(Plan.create('STUDIO').value!.isEssentiel).toBe(false);
      expect(Plan.create('ATELIER').value!.isEssentiel).toBe(false);
    });
  });

  describe('isStudio', () => {
    it('should return true for STUDIO plan', () => {
      const plan = Plan.create('STUDIO').value!;

      expect(plan.isStudio).toBe(true);
    });

    it('should return false for other plans', () => {
      expect(Plan.create('ESSENTIEL').value!.isStudio).toBe(false);
      expect(Plan.create('ATELIER').value!.isStudio).toBe(false);
    });
  });

  describe('isAtelier', () => {
    it('should return true for ATELIER plan', () => {
      const plan = Plan.create('ATELIER').value!;

      expect(plan.isAtelier).toBe(true);
    });

    it('should return false for other plans', () => {
      expect(Plan.create('ESSENTIEL').value!.isAtelier).toBe(false);
      expect(Plan.create('STUDIO').value!.isAtelier).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create ESSENTIEL plan via static method', () => {
      const plan = Plan.essentiel();

      expect(plan.value).toBe('ESSENTIEL');
      expect(plan.isEssentiel).toBe(true);
    });

    it('should create STUDIO plan via static method', () => {
      const plan = Plan.studio();

      expect(plan.value).toBe('STUDIO');
      expect(plan.isStudio).toBe(true);
    });

    it('should create ATELIER plan via static method', () => {
      const plan = Plan.atelier();

      expect(plan.value).toBe('ATELIER');
      expect(plan.isAtelier).toBe(true);
    });
  });

  describe('equality', () => {
    it('should be equal to another Plan with same value', () => {
      const plan1 = Plan.create('ESSENTIEL').value!;
      const plan2 = Plan.create('ESSENTIEL').value!;

      expect(plan1.equals(plan2)).toBe(true);
    });

    it('should not be equal to another Plan with different value', () => {
      const plan1 = Plan.create('ESSENTIEL').value!;
      const plan2 = Plan.create('STUDIO').value!;

      expect(plan1.equals(plan2)).toBe(false);
    });
  });
});
