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
 * Customer summary data for listing
 */
export interface CustomerSummary {
  /** Unique customer identifier */
  id: string;
  /** Customer display name */
  name: string;
  /** Customer email address */
  email: string;
  /** Total number of orders placed */
  totalOrders: number;
  /** Total amount spent in cents */
  totalSpent: number;
  /** Date of the last order */
  lastOrderDate: Date;
}

/**
 * Available fields for sorting customers
 */
export type CustomerSortField = 'lastOrderDate' | 'totalSpent' | 'totalOrders' | 'name';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Input for listing customers
 */
export interface ListCustomersParams {
  creatorId: string;
  search?: string;
  sortBy: CustomerSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

/**
 * Result from listing customers
 */
export interface ListCustomersResult {
  customers: CustomerSummary[];
  total: number;
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

/**
 * Customer Repository Interface
 *
 * Provides methods to retrieve customer data for creator dashboards.
 */
export interface CustomerRepository {
  /**
   * List customers for a creator with pagination and filtering
   */
  listCustomers(params: ListCustomersParams): Promise<ListCustomersResult>;
}

/**
 * Admin platform statistics
 *
 * Story 11-1: Dashboard admin KPIs
 */
export interface AdminPlatformStats {
  /** Total number of active creators */
  totalCreators: number;
  /** Previous period creator count for comparison */
  previousCreators: number;
  /** Total platform revenue in cents */
  totalPlatformRevenue: number;
  /** Previous period platform revenue for comparison */
  previousPlatformRevenue: number;
  /** Total number of orders across the platform */
  totalOrders: number;
  /** Previous period orders for comparison */
  previousOrders: number;
  /** New creators registered in current period */
  newCreators: number;
  /** New creators in previous period for comparison */
  previousNewCreators: number;
}

/**
 * Admin Analytics Repository Interface
 *
 * Provides methods to retrieve platform-wide analytics for admin dashboards.
 */
export interface AdminAnalyticsRepository {
  /**
   * Get platform-wide statistics for admin dashboard
   */
  getPlatformStats(period: TimePeriod): Promise<AdminPlatformStats>;
}

/**
 * Creator status for admin management
 *
 * Story 11-2: Liste gestion createurs
 */
export type CreatorStatus = 'ACTIVE' | 'SUSPENDED';

/**
 * Available fields for sorting creators
 */
export type CreatorSortField = 'name' | 'email' | 'registeredAt' | 'totalRevenue';

/**
 * Creator summary data for admin listing
 *
 * Story 11-2: Liste gestion createurs
 */
export interface CreatorSummary {
  /** Unique creator identifier */
  id: string;
  /** Creator display name */
  name: string;
  /** Creator email address */
  email: string;
  /** Registration date */
  registeredAt: Date;
  /** Creator status */
  status: CreatorStatus;
  /** Total revenue in cents */
  totalRevenue: number;
}

/**
 * Input for listing creators
 */
export interface ListCreatorsParams {
  /** Search query for name or email */
  search?: string;
  /** Filter by status */
  statusFilter?: CreatorStatus | 'ALL';
  /** Field to sort by */
  sortBy: CreatorSortField;
  /** Sort direction */
  sortDirection: SortDirection;
  /** Page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
}

/**
 * Result from listing creators
 */
export interface ListCreatorsResult {
  creators: CreatorSummary[];
  total: number;
}

/**
 * Creator Repository Interface for Admin
 *
 * Story 11-2: Liste gestion createurs
 *
 * Provides methods to manage creators from admin panel.
 */
export interface CreatorRepository {
  /**
   * List creators with pagination and filtering
   */
  listCreators(params: ListCreatorsParams): Promise<ListCreatorsResult>;

  /**
   * Suspend a creator
   */
  suspendCreator(creatorId: string): Promise<void>;

  /**
   * Reactivate a suspended creator
   */
  reactivateCreator(creatorId: string): Promise<void>;
}
