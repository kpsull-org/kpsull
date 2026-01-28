import { describe, it, expect } from 'vitest';
import { Plan, PlanType } from '../plan.vo';

describe('Plan Value Object', () => {
  describe('create', () => {
    it('should create FREE plan', () => {
      const result = Plan.create('FREE');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('FREE');
    });

    it('should create PRO plan', () => {
      const result = Plan.create('PRO');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('PRO');
    });

    it('should fail with invalid plan type', () => {
      const result = Plan.create('INVALID' as PlanType);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Plan invalide');
    });
  });

  describe('isFree', () => {
    it('should return true for FREE plan', () => {
      const plan = Plan.create('FREE').value!;

      expect(plan.isFree).toBe(true);
    });

    it('should return false for PRO plan', () => {
      const plan = Plan.create('PRO').value!;

      expect(plan.isFree).toBe(false);
    });
  });

  describe('isPro', () => {
    it('should return true for PRO plan', () => {
      const plan = Plan.create('PRO').value!;

      expect(plan.isPro).toBe(true);
    });

    it('should return false for FREE plan', () => {
      const plan = Plan.create('FREE').value!;

      expect(plan.isPro).toBe(false);
    });
  });

  describe('equality', () => {
    it('should be equal to another Plan with same value', () => {
      const plan1 = Plan.create('FREE').value!;
      const plan2 = Plan.create('FREE').value!;

      expect(plan1.equals(plan2)).toBe(true);
    });

    it('should not be equal to another Plan with different value', () => {
      const plan1 = Plan.create('FREE').value!;
      const plan2 = Plan.create('PRO').value!;

      expect(plan1.equals(plan2)).toBe(false);
    });
  });
});
