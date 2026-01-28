import { describe, it, expect } from 'vitest';
import {
  PLAN_FEATURES,
  FEATURE_LABELS,
  getPlanLimits,
  hasFeature,
  isUnlimited,
} from '../plan-features';

describe('Plan Features', () => {
  describe('PLAN_FEATURES', () => {
    it('should define FREE plan with correct limits', () => {
      expect(PLAN_FEATURES.FREE.productLimit).toBe(5);
      expect(PLAN_FEATURES.FREE.salesLimit).toBe(10);
    });

    it('should define PRO plan with unlimited limits', () => {
      expect(PLAN_FEATURES.PRO.productLimit).toBe(-1);
      expect(PLAN_FEATURES.PRO.salesLimit).toBe(-1);
    });

    it('should define FREE plan features', () => {
      const freeFeatures = PLAN_FEATURES.FREE.features;

      expect(freeFeatures.basicDashboard).toBe(true);
      expect(freeFeatures.productManagement).toBe(true);
      expect(freeFeatures.advancedAnalytics).toBe(false);
      expect(freeFeatures.exportReports).toBe(false);
    });

    it('should define PRO plan with all features enabled', () => {
      const proFeatures = PLAN_FEATURES.PRO.features;

      expect(proFeatures.basicDashboard).toBe(true);
      expect(proFeatures.advancedAnalytics).toBe(true);
      expect(proFeatures.exportReports).toBe(true);
      expect(proFeatures.prioritySupport).toBe(true);
    });
  });

  describe('FEATURE_LABELS', () => {
    it('should have labels for all features', () => {
      expect(FEATURE_LABELS.basicDashboard).toBe('Dashboard de base');
      expect(FEATURE_LABELS.advancedAnalytics).toBe('Analytics avancés');
      expect(FEATURE_LABELS.exportReports).toBe('Export des rapports');
    });
  });

  describe('getPlanLimits', () => {
    it('should return FREE plan limits', () => {
      const limits = getPlanLimits('FREE');

      expect(limits.productLimit).toBe(5);
      expect(limits.salesLimit).toBe(10);
    });

    it('should return PRO plan limits (unlimited)', () => {
      const limits = getPlanLimits('PRO');

      expect(limits.productLimit).toBe(-1);
      expect(limits.salesLimit).toBe(-1);
    });
  });

  describe('hasFeature', () => {
    it('should return true for FREE plan basic features', () => {
      expect(hasFeature('FREE', 'basicDashboard')).toBe(true);
      expect(hasFeature('FREE', 'productManagement')).toBe(true);
    });

    it('should return false for FREE plan advanced features', () => {
      expect(hasFeature('FREE', 'advancedAnalytics')).toBe(false);
      expect(hasFeature('FREE', 'exportReports')).toBe(false);
    });

    it('should return true for all PRO plan features', () => {
      expect(hasFeature('PRO', 'advancedAnalytics')).toBe(true);
      expect(hasFeature('PRO', 'exportReports')).toBe(true);
      expect(hasFeature('PRO', 'prioritySupport')).toBe(true);
    });
  });

  describe('isUnlimited', () => {
    it('should return true for -1 limit', () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it('should return false for positive limits', () => {
      expect(isUnlimited(5)).toBe(false);
      expect(isUnlimited(10)).toBe(false);
    });
  });
});
