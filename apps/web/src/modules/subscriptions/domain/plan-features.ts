import { PlanType } from './value-objects/plan.vo';

export interface PlanFeatures {
  basicDashboard: boolean;
  productManagement: boolean;
  orderManagement: boolean;
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  exportReports: boolean;
  prioritySupport: boolean;
  customDomain: boolean;
}

export interface PlanConfig {
  productLimit: number; // -1 for unlimited
  salesLimit: number; // -1 for unlimited
  features: PlanFeatures;
}

export const PLAN_FEATURES: Record<PlanType, PlanConfig> = {
  FREE: {
    productLimit: 5,
    salesLimit: 10,
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: false,
      exportReports: false,
      prioritySupport: false,
      customDomain: false,
    },
  },
  PRO: {
    productLimit: -1, // Unlimited
    salesLimit: -1, // Unlimited
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      exportReports: true,
      prioritySupport: true,
      customDomain: true,
    },
  },
};

export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  basicDashboard: 'Dashboard de base',
  productManagement: 'Gestion des produits',
  orderManagement: 'Gestion des commandes',
  basicAnalytics: 'Statistiques de base',
  advancedAnalytics: 'Analytics avancés',
  exportReports: 'Export des rapports',
  prioritySupport: 'Support prioritaire',
  customDomain: 'Domaine personnalisé',
};

/**
 * Get plan limits (products, sales)
 */
export function getPlanLimits(plan: PlanType): { productLimit: number; salesLimit: number } {
  const config = PLAN_FEATURES[plan];
  return {
    productLimit: config.productLimit,
    salesLimit: config.salesLimit,
  };
}

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeature(plan: PlanType, feature: keyof PlanFeatures): boolean {
  return PLAN_FEATURES[plan].features[feature];
}

/**
 * Check if a limit value represents unlimited
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Check if current usage exceeds or equals limit
 */
export function isAtLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return false;
  return current >= limit;
}

/**
 * Check if current usage is near limit (>= 80%)
 */
export function isNearLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return false;
  return (current / limit) * 100 >= 80;
}
