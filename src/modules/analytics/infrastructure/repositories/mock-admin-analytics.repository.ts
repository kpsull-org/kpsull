import type {
  AdminAnalyticsRepository,
  AdminPlatformStats,
  MonthlyRevenueDataPoint,
  CreatorRevenueBreakdown,
} from '../../application/ports';
import { TimePeriod } from '../../domain/value-objects';

/**
 * Default stats for fallback
 */
const DEFAULT_STATS: AdminPlatformStats = {
  totalCreators: 142,
  previousCreators: 125,
  totalPlatformRevenue: 18750000,
  previousPlatformRevenue: 15200000,
  subscriptionRevenue: 12500000,
  subscriptionMRR: 1041667,
  commissionRevenue: 6250000,
  totalOrders: 2145,
  previousOrders: 1890,
  newCreators: 24,
  previousNewCreators: 18,
};

/**
 * Mock admin analytics data for development and testing
 */
const MOCK_ADMIN_STATS: Record<string, AdminPlatformStats> = {
  LAST_7_DAYS: {
    totalCreators: 142,
    previousCreators: 138,
    totalPlatformRevenue: 4850000,
    previousPlatformRevenue: 4200000,
    subscriptionRevenue: 3200000,
    subscriptionMRR: 1041667,
    commissionRevenue: 1650000,
    totalOrders: 523,
    previousOrders: 478,
    newCreators: 8,
    previousNewCreators: 6,
  },
  LAST_30_DAYS: {
    totalCreators: 142,
    previousCreators: 125,
    totalPlatformRevenue: 18750000,
    previousPlatformRevenue: 15200000,
    subscriptionRevenue: 12500000,
    subscriptionMRR: 1041667,
    commissionRevenue: 6250000,
    totalOrders: 2145,
    previousOrders: 1890,
    newCreators: 24,
    previousNewCreators: 18,
  },
  LAST_90_DAYS: {
    totalCreators: 142,
    previousCreators: 98,
    totalPlatformRevenue: 52300000,
    previousPlatformRevenue: 38500000,
    subscriptionRevenue: 35000000,
    subscriptionMRR: 1041667,
    commissionRevenue: 17300000,
    totalOrders: 6420,
    previousOrders: 4850,
    newCreators: 65,
    previousNewCreators: 42,
  },
  LAST_365_DAYS: {
    totalCreators: 142,
    previousCreators: 45,
    totalPlatformRevenue: 198500000,
    previousPlatformRevenue: 125000000,
    subscriptionRevenue: 132000000,
    subscriptionMRR: 1041667,
    commissionRevenue: 66500000,
    totalOrders: 24500,
    previousOrders: 15800,
    newCreators: 142,
    previousNewCreators: 45,
  },
};

/**
 * MockAdminAnalyticsRepository
 *
 * Mock implementation of AdminAnalyticsRepository for development and testing.
 * Provides realistic platform-wide analytics data.
 *
 * Story 11-1: Dashboard admin KPIs
 */
export class MockAdminAnalyticsRepository implements AdminAnalyticsRepository {
  private stats: Record<string, AdminPlatformStats>;

  constructor(stats: Record<string, AdminPlatformStats> = MOCK_ADMIN_STATS) {
    this.stats = stats;
  }

  async getPlatformStats(period: TimePeriod): Promise<AdminPlatformStats> {
    const periodType = period.value;
    const data = this.stats[periodType] ?? this.stats['LAST_30_DAYS'] ?? DEFAULT_STATS;

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));

    return data;
  }

  async getMonthlyRevenue(_year: number): Promise<MonthlyRevenueDataPoint[]> {
    return Array.from({ length: 12 }, (_, i) => {
      const commissions = Math.floor(Math.random() * 300000) + 50000;
      const subscriptions = Math.floor(Math.random() * 200000) + 50000;
      return {
        month: i,
        revenue: commissions + subscriptions,
        commissions,
        subscriptions,
      };
    });
  }

  async getRevenueByCreator(limit: number): Promise<CreatorRevenueBreakdown[]> {
    return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      creatorId: `mock-creator-${i + 1}`,
      creatorName: `Createur ${i + 1}`,
      creatorEmail: `creator${i + 1}@example.com`,
      orderCount: 10 * (3 - i),
      totalRevenue: 500000 * (3 - i),
    }));
  }
}
