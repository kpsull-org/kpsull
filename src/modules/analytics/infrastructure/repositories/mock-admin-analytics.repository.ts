import type { AdminAnalyticsRepository, AdminPlatformStats } from '../../application/ports';
import { TimePeriod } from '../../domain/value-objects';

/**
 * Default stats for fallback
 */
const DEFAULT_STATS: AdminPlatformStats = {
  totalCreators: 142,
  previousCreators: 125,
  totalPlatformRevenue: 18750000,
  previousPlatformRevenue: 15200000,
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
    totalPlatformRevenue: 4850000, // 48,500 EUR
    previousPlatformRevenue: 4200000,
    totalOrders: 523,
    previousOrders: 478,
    newCreators: 8,
    previousNewCreators: 6,
  },
  LAST_30_DAYS: {
    totalCreators: 142,
    previousCreators: 125,
    totalPlatformRevenue: 18750000, // 187,500 EUR
    previousPlatformRevenue: 15200000,
    totalOrders: 2145,
    previousOrders: 1890,
    newCreators: 24,
    previousNewCreators: 18,
  },
  LAST_90_DAYS: {
    totalCreators: 142,
    previousCreators: 98,
    totalPlatformRevenue: 52300000, // 523,000 EUR
    previousPlatformRevenue: 38500000,
    totalOrders: 6420,
    previousOrders: 4850,
    newCreators: 65,
    previousNewCreators: 42,
  },
  LAST_365_DAYS: {
    totalCreators: 142,
    previousCreators: 45,
    totalPlatformRevenue: 198500000, // 1,985,000 EUR
    previousPlatformRevenue: 125000000,
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
}
