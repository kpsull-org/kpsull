import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import { TimePeriod, type TimePeriodType } from '../../domain/value-objects';
import type {
  AnalyticsRepository,
  DashboardStats,
  RevenueDataPoint,
} from '../ports';

export interface GetDashboardStatsInput {
  creatorId: string;
  period?: TimePeriodType;
}

export interface GetDashboardStatsOutput {
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
 * GetDashboardStatsUseCase
 *
 * Retrieves dashboard statistics for a creator.
 * Returns metrics like revenue, orders, products, reviews, etc.
 */
export class GetDashboardStatsUseCase
  implements UseCase<GetDashboardStatsInput, GetDashboardStatsOutput>
{
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute(
    input: GetDashboardStatsInput
  ): Promise<Result<GetDashboardStatsOutput>> {
    // Validate creator ID
    if (!input.creatorId || input.creatorId.trim() === '') {
      return Result.fail('Creator ID est requis');
    }

    // Parse period (default to LAST_30_DAYS)
    const periodType = input.period ?? 'LAST_30_DAYS';
    const periodResult = TimePeriod.create(periodType);

    if (periodResult.isFailure) {
      return Result.fail(`Type de periode invalide: ${periodType}`);
    }

    const period = periodResult.value;

    try {
      const stats: DashboardStats = await this.analyticsRepository.getDashboardStats(
        input.creatorId,
        period
      );

      return Result.ok<GetDashboardStatsOutput>({
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        averageOrderValue: stats.averageOrderValue,
        totalProducts: stats.totalProducts,
        publishedProducts: stats.publishedProducts,
        totalReviews: stats.totalReviews,
        averageRating: stats.averageRating,
        newCustomers: stats.newCustomers,
        revenueByDay: stats.revenueByDay,
      });
    } catch (error) {
      /* c8 ignore start */
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      /* c8 ignore stop */
      return Result.fail(`Erreur lors de la recuperation des statistiques: ${message}`);
    }
  }
}
