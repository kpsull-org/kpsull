import { describe, it, expect } from 'vitest';
import {
  PLAN_FEATURES,
  FEATURE_LABELS,
  getPlanLimits,
  getPlanConfig,
  getPlanPricing,
  hasFeature,
  isUnlimited,
  isAtLimit,
  isNearLimit,
  calculateCommission,
  getTrialEndDate,
  calculateYearlySavings,
  formatPrice,
  getAllPlans,
  isUpgrade,
} from '../plan-features';

describe('Plan Features', () => {
  describe('PLAN_FEATURES', () => {
    it('should define ESSENTIEL plan with correct limits', () => {
      expect(PLAN_FEATURES.ESSENTIEL.productLimit).toBe(10);
      expect(PLAN_FEATURES.ESSENTIEL.commissionRate).toBe(0.05);
      expect(PLAN_FEATURES.ESSENTIEL.trialDays).toBe(0);
    });

    it('should define STUDIO plan with correct limits', () => {
      expect(PLAN_FEATURES.STUDIO.productLimit).toBe(20);
      expect(PLAN_FEATURES.STUDIO.commissionRate).toBe(0.04);
      expect(PLAN_FEATURES.STUDIO.trialDays).toBe(0);
    });

    it('should define ATELIER plan with unlimited limits and trial', () => {
      expect(PLAN_FEATURES.ATELIER.productLimit).toBe(-1);
      expect(PLAN_FEATURES.ATELIER.commissionRate).toBe(0.03);
      expect(PLAN_FEATURES.ATELIER.trialDays).toBe(14);
    });

    it('should define ESSENTIEL plan features', () => {
      const features = PLAN_FEATURES.ESSENTIEL.features;

      expect(features.basicDashboard).toBe(true);
      expect(features.productManagement).toBe(true);
      expect(features.advancedAnalytics).toBe(false);
      expect(features.exportReports).toBe(false);
      expect(features.prioritySupport).toBe(false);
    });

    it('should define STUDIO plan features', () => {
      const features = PLAN_FEATURES.STUDIO.features;

      expect(features.basicDashboard).toBe(true);
      expect(features.advancedAnalytics).toBe(true);
      expect(features.exportReports).toBe(true);
      expect(features.prioritySupport).toBe(false);
      expect(features.customDomain).toBe(false);
    });

    it('should define ATELIER plan with all features enabled', () => {
      const features = PLAN_FEATURES.ATELIER.features;

      expect(features.basicDashboard).toBe(true);
      expect(features.advancedAnalytics).toBe(true);
      expect(features.exportReports).toBe(true);
      expect(features.prioritySupport).toBe(true);
      expect(features.customDomain).toBe(true);
      expect(features.trialAvailable).toBe(true);
    });

    it('should have correct pricing for all plans', () => {
      // ESSENTIEL: 29€/mois, 290€/an
      expect(PLAN_FEATURES.ESSENTIEL.pricing.monthly).toBe(2900);
      expect(PLAN_FEATURES.ESSENTIEL.pricing.yearly).toBe(29000);

      // STUDIO: 79€/mois, 790€/an
      expect(PLAN_FEATURES.STUDIO.pricing.monthly).toBe(7900);
      expect(PLAN_FEATURES.STUDIO.pricing.yearly).toBe(79000);

      // ATELIER: 95€/mois, 950€/an
      expect(PLAN_FEATURES.ATELIER.pricing.monthly).toBe(9500);
      expect(PLAN_FEATURES.ATELIER.pricing.yearly).toBe(95000);
    });
  });

  describe('FEATURE_LABELS', () => {
    it('should have labels for all features', () => {
      expect(FEATURE_LABELS.basicDashboard).toBe('Dashboard de base');
      expect(FEATURE_LABELS.advancedAnalytics).toBe('Analytics avances');
      expect(FEATURE_LABELS.exportReports).toBe('Export des rapports');
      expect(FEATURE_LABELS.prioritySupport).toBe('Support prioritaire');
    });
  });

  describe('getPlanConfig', () => {
    it('should return full config for a plan', () => {
      const config = getPlanConfig('STUDIO');

      expect(config.name).toBe('Studio');
      expect(config.productLimit).toBe(20);
      expect(config.commissionRate).toBe(0.04);
    });
  });

  describe('getPlanLimits', () => {
    it('should return ESSENTIEL plan limits', () => {
      const limits = getPlanLimits('ESSENTIEL');

      expect(limits.productLimit).toBe(10);
      expect(limits.commissionRate).toBe(0.05);
      expect(limits.pinnedProductsLimit).toBe(3);
    });

    it('should return ATELIER plan limits (unlimited)', () => {
      const limits = getPlanLimits('ATELIER');

      expect(limits.productLimit).toBe(-1);
      expect(limits.commissionRate).toBe(0.03);
      expect(limits.pinnedProductsLimit).toBe(-1);
    });
  });

  describe('getPlanPricing', () => {
    it('should return monthly price', () => {
      expect(getPlanPricing('ESSENTIEL', 'month')).toBe(2900);
      expect(getPlanPricing('STUDIO', 'month')).toBe(7900);
      expect(getPlanPricing('ATELIER', 'month')).toBe(9500);
    });

    it('should return yearly price', () => {
      expect(getPlanPricing('ESSENTIEL', 'year')).toBe(29000);
      expect(getPlanPricing('STUDIO', 'year')).toBe(79000);
      expect(getPlanPricing('ATELIER', 'year')).toBe(95000);
    });
  });

  describe('hasFeature', () => {
    it('should return true for ESSENTIEL plan basic features', () => {
      expect(hasFeature('ESSENTIEL', 'basicDashboard')).toBe(true);
      expect(hasFeature('ESSENTIEL', 'productManagement')).toBe(true);
    });

    it('should return false for ESSENTIEL plan advanced features', () => {
      expect(hasFeature('ESSENTIEL', 'advancedAnalytics')).toBe(false);
      expect(hasFeature('ESSENTIEL', 'exportReports')).toBe(false);
    });

    it('should return true for STUDIO plan analytics features', () => {
      expect(hasFeature('STUDIO', 'advancedAnalytics')).toBe(true);
      expect(hasFeature('STUDIO', 'exportReports')).toBe(true);
    });

    it('should return true for all ATELIER plan features', () => {
      expect(hasFeature('ATELIER', 'advancedAnalytics')).toBe(true);
      expect(hasFeature('ATELIER', 'exportReports')).toBe(true);
      expect(hasFeature('ATELIER', 'prioritySupport')).toBe(true);
      expect(hasFeature('ATELIER', 'customDomain')).toBe(true);
    });
  });

  describe('isUnlimited', () => {
    it('should return true for -1 limit', () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it('should return false for positive limits', () => {
      expect(isUnlimited(10)).toBe(false);
      expect(isUnlimited(20)).toBe(false);
    });
  });

  describe('isAtLimit', () => {
    it('should return true when at limit', () => {
      expect(isAtLimit(10, 10)).toBe(true);
      expect(isAtLimit(11, 10)).toBe(true);
    });

    it('should return false when below limit', () => {
      expect(isAtLimit(5, 10)).toBe(false);
    });

    it('should return false for unlimited', () => {
      expect(isAtLimit(1000, -1)).toBe(false);
    });
  });

  describe('isNearLimit', () => {
    it('should return true when at 80% or more', () => {
      expect(isNearLimit(8, 10)).toBe(true);
      expect(isNearLimit(9, 10)).toBe(true);
    });

    it('should return false when below 80%', () => {
      expect(isNearLimit(7, 10)).toBe(false);
    });

    it('should return false for unlimited', () => {
      expect(isNearLimit(1000, -1)).toBe(false);
    });
  });

  describe('calculateCommission', () => {
    it('should calculate 5% commission for ESSENTIEL', () => {
      expect(calculateCommission('ESSENTIEL', 10000)).toBe(500);
    });

    it('should calculate 4% commission for STUDIO', () => {
      expect(calculateCommission('STUDIO', 10000)).toBe(400);
    });

    it('should calculate 3% commission for ATELIER', () => {
      expect(calculateCommission('ATELIER', 10000)).toBe(300);
    });
  });

  describe('getTrialEndDate', () => {
    it('should return null for plans without trial', () => {
      expect(getTrialEndDate('ESSENTIEL')).toBeNull();
      expect(getTrialEndDate('STUDIO')).toBeNull();
    });

    it('should return date 14 days later for ATELIER', () => {
      const startDate = new Date('2025-01-01');
      const endDate = getTrialEndDate('ATELIER', startDate);

      expect(endDate).not.toBeNull();
      expect(endDate?.toISOString().split('T')[0]).toBe('2025-01-15');
    });
  });

  describe('calculateYearlySavings', () => {
    it('should calculate 2 months savings for ESSENTIEL', () => {
      // 29€ * 2 = 58€ = 5800 cents
      expect(calculateYearlySavings('ESSENTIEL')).toBe(5800);
    });

    it('should calculate 2 months savings for STUDIO', () => {
      // 79€ * 2 = 158€ = 15800 cents
      expect(calculateYearlySavings('STUDIO')).toBe(15800);
    });

    it('should calculate 2 months savings for ATELIER', () => {
      // 95€ * 2 = 190€ = 19000 cents
      expect(calculateYearlySavings('ATELIER')).toBe(19000);
    });
  });

  describe('formatPrice', () => {
    it('should format cents to euros with currency symbol', () => {
      const formatted = formatPrice(2900);
      expect(formatted).toContain('29');
      expect(formatted).toContain('€');
    });
  });

  describe('getAllPlans', () => {
    it('should return all plans in order', () => {
      expect(getAllPlans()).toEqual(['ESSENTIEL', 'STUDIO', 'ATELIER']);
    });
  });

  describe('isUpgrade', () => {
    it('should return true for upgrades', () => {
      expect(isUpgrade('ESSENTIEL', 'STUDIO')).toBe(true);
      expect(isUpgrade('ESSENTIEL', 'ATELIER')).toBe(true);
      expect(isUpgrade('STUDIO', 'ATELIER')).toBe(true);
    });

    it('should return false for same plan', () => {
      expect(isUpgrade('ESSENTIEL', 'ESSENTIEL')).toBe(false);
      expect(isUpgrade('STUDIO', 'STUDIO')).toBe(false);
    });

    it('should return false for downgrades', () => {
      expect(isUpgrade('STUDIO', 'ESSENTIEL')).toBe(false);
      expect(isUpgrade('ATELIER', 'ESSENTIEL')).toBe(false);
      expect(isUpgrade('ATELIER', 'STUDIO')).toBe(false);
    });
  });
});
