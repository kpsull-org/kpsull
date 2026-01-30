import { PlanType } from './value-objects/plan.vo';

export type BillingInterval = 'month' | 'year';

export interface PlanPricing {
  monthly: number; // in cents
  yearly: number; // in cents
}

export interface PlanFeatures {
  basicDashboard: boolean;
  productManagement: boolean;
  orderManagement: boolean;
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  exportReports: boolean;
  prioritySupport: boolean;
  customDomain: boolean;
  pinnedProducts: boolean;
  trialAvailable: boolean;
}

export interface PlanConfig {
  name: string;
  productLimit: number; // -1 for unlimited
  commissionRate: number; // as decimal (0.05 = 5%)
  pinnedProductsLimit: number;
  trialDays: number; // 0 if no trial
  pricing: PlanPricing;
  features: PlanFeatures;
}

/**
 * Plan configurations for Kpsull creators
 *
 * Pricing: Annual = 10 months (2 months free)
 * - ESSENTIEL: 29€/mois ou 290€/an - Commission 5% - 10 produits
 * - STUDIO: 79€/mois ou 790€/an - Commission 4% - 20 produits
 * - ATELIER: 95€/mois ou 950€/an - Commission 3% - Illimité - 14j essai
 */
export const PLAN_FEATURES: Record<PlanType, PlanConfig> = {
  ESSENTIEL: {
    name: 'Essentiel',
    productLimit: 10,
    commissionRate: 0.05, // 5%
    pinnedProductsLimit: 3,
    trialDays: 0,
    pricing: {
      monthly: 2900, // 29€
      yearly: 29000, // 290€
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: false,
      exportReports: false,
      prioritySupport: false,
      customDomain: false,
      pinnedProducts: true,
      trialAvailable: false,
    },
  },
  STUDIO: {
    name: 'Studio',
    productLimit: 20,
    commissionRate: 0.04, // 4%
    pinnedProductsLimit: 5,
    trialDays: 0,
    pricing: {
      monthly: 7900, // 79€
      yearly: 79000, // 790€
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      exportReports: true,
      prioritySupport: false,
      customDomain: false,
      pinnedProducts: true,
      trialAvailable: false,
    },
  },
  ATELIER: {
    name: 'Atelier',
    productLimit: -1, // Unlimited
    commissionRate: 0.03, // 3%
    pinnedProductsLimit: -1, // Unlimited
    trialDays: 14,
    pricing: {
      monthly: 9500, // 95€
      yearly: 95000, // 950€
    },
    features: {
      basicDashboard: true,
      productManagement: true,
      orderManagement: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      exportReports: true,
      prioritySupport: true,
      customDomain: true,
      pinnedProducts: true,
      trialAvailable: true,
    },
  },
};

export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  basicDashboard: 'Dashboard de base',
  productManagement: 'Gestion des produits',
  orderManagement: 'Gestion des commandes',
  basicAnalytics: 'Statistiques de base',
  advancedAnalytics: 'Analytics avances',
  exportReports: 'Export des rapports',
  prioritySupport: 'Support prioritaire',
  customDomain: 'Domaine personnalise',
  pinnedProducts: 'Produits mis en avant',
  trialAvailable: 'Essai gratuit disponible',
};

/**
 * Get plan configuration
 */
export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLAN_FEATURES[plan];
}

/**
 * Get plan limits (products, commission)
 */
export function getPlanLimits(plan: PlanType): {
  productLimit: number;
  commissionRate: number;
  pinnedProductsLimit: number;
} {
  const config = PLAN_FEATURES[plan];
  return {
    productLimit: config.productLimit,
    commissionRate: config.commissionRate,
    pinnedProductsLimit: config.pinnedProductsLimit,
  };
}

/**
 * Get plan pricing
 */
export function getPlanPricing(plan: PlanType, interval: BillingInterval): number {
  const config = PLAN_FEATURES[plan];
  return interval === 'month' ? config.pricing.monthly : config.pricing.yearly;
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

/**
 * Calculate commission amount
 */
export function calculateCommission(plan: PlanType, amount: number): number {
  const config = PLAN_FEATURES[plan];
  return Math.round(amount * config.commissionRate);
}

/**
 * Get trial end date for a plan
 */
export function getTrialEndDate(plan: PlanType, startDate: Date = new Date()): Date | null {
  const config = PLAN_FEATURES[plan];
  if (config.trialDays === 0) return null;

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + config.trialDays);
  return endDate;
}

/**
 * Calculate savings when choosing yearly billing
 * Returns savings in cents (2 months free = monthly * 2)
 */
export function calculateYearlySavings(plan: PlanType): number {
  const config = PLAN_FEATURES[plan];
  // Yearly = 10 months, so savings = 2 months
  return config.pricing.monthly * 2;
}

/**
 * Format price for display (cents to euros)
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Get all plans ordered by tier
 */
export function getAllPlans(): PlanType[] {
  return ['ESSENTIEL', 'STUDIO', 'ATELIER'];
}

/**
 * Check if plan B is an upgrade from plan A
 */
export function isUpgrade(from: PlanType, to: PlanType): boolean {
  const order: Record<PlanType, number> = {
    ESSENTIEL: 1,
    STUDIO: 2,
    ATELIER: 3,
  };
  return order[to] > order[from];
}
