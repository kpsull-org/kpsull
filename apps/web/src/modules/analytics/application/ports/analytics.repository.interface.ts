import { TimePeriod } from '../../domain/value-objects';

/**
 * Revenue data point for time-series charts
 */
export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

/**
 * Top selling product data
 */
export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

/**
 * Sales by order status
 */
export interface SalesByStatus {
  status: string;
  count: number;
  revenue: number;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  publishedProducts: number;
  totalReviews: number;
  averageRating: number;
  newCustomers: number;
  revenueByDay: RevenueDataPoint[];
}

/**
 * Sales analytics data
 */
export interface SalesAnalytics {
  topSellingProducts: TopSellingProduct[];
  salesByStatus: SalesByStatus[];
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
}

/**
 * Analytics Repository Interface
 *
 * Provides methods to retrieve analytics data for creator dashboards.
 */
export interface AnalyticsRepository {
  /**
   * Get dashboard statistics for a creator
   */
  getDashboardStats(creatorId: string, period: TimePeriod): Promise<DashboardStats>;

  /**
   * Get sales analytics for a creator
   */
  getSalesAnalytics(creatorId: string, period: TimePeriod): Promise<SalesAnalytics>;
}
