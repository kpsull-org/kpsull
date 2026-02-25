import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import { TimePeriod, type TimePeriodType } from '../../domain/value-objects';
import type {
  AnalyticsRepository,
  SalesAnalytics,
  TopSellingProduct,
  SalesByStatus,
} from '../ports';

export interface GetSalesAnalyticsInput {
  creatorId: string;
  period?: TimePeriodType;
}

export interface GetSalesAnalyticsOutput {
  topSellingProducts: TopSellingProduct[];
  salesByStatus: SalesByStatus[];
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
}

/**
 * GetSalesAnalyticsUseCase
 *
 * Retrieves sales analytics for a creator.
 * Returns top selling products, sales by status, and revenue comparison.
 */
export class GetSalesAnalyticsUseCase
  implements UseCase<GetSalesAnalyticsInput, GetSalesAnalyticsOutput>
{
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async execute(
    input: GetSalesAnalyticsInput
  ): Promise<Result<GetSalesAnalyticsOutput>> {
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
      const analytics: SalesAnalytics =
        await this.analyticsRepository.getSalesAnalytics(
          input.creatorId,
          period
        );

      return Result.ok<GetSalesAnalyticsOutput>({
        topSellingProducts: analytics.topSellingProducts,
        salesByStatus: analytics.salesByStatus,
        currentPeriodRevenue: analytics.currentPeriodRevenue,
        previousPeriodRevenue: analytics.previousPeriodRevenue,
        revenueChange: analytics.revenueChange,
        revenueChangePercent: analytics.revenueChangePercent,
      });
    } catch (error) {
      /* c8 ignore start */
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      /* c8 ignore stop */
      return Result.fail(
        `Erreur lors de la recuperation des analytics de ventes: ${message}`
      );
    }
  }
}
