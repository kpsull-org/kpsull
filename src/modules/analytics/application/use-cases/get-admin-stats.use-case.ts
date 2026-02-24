import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application';
import { TimePeriod, type TimePeriodType } from '../../domain/value-objects';
import type { AdminAnalyticsRepository, AdminPlatformStats } from '../ports';

export interface GetAdminStatsInput {
  period?: TimePeriodType;
}

export interface GetAdminStatsOutput {
  /** Total number of active creators */
  totalCreators: number;
  /** Percentage change in creators vs previous period */
  creatorsChange: number;
  /** True platform revenue (subscriptions + commissions) in cents */
  totalPlatformRevenue: number;
  /** Percentage change in revenue vs previous period */
  revenueChange: number;
  /** Revenue from subscriptions in the current period in cents (NOT MRR) */
  subscriptionRevenue: number;
  /** Monthly Recurring Revenue from active subscriptions in cents */
  subscriptionMRR: number;
  /** Revenue from commissions only in cents */
  commissionRevenue: number;
  /** Total number of orders across the platform */
  totalOrders: number;
  /** Percentage change in orders vs previous period */
  ordersChange: number;
  /** New creators registered in current period */
  newCreators: number;
  /** Percentage change in new creators vs previous period */
  newCreatorsChange: number;
}

/**
 * Calculate percentage change between current and previous values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * GetAdminStatsUseCase
 *
 * Story 11-1: Dashboard admin KPIs
 *
 * Retrieves platform-wide statistics for admin dashboard.
 * Returns metrics like total creators, platform revenue, total orders.
 *
 * Acceptance Criteria:
 * - AC1: KPIs plateforme (nombre createurs, CA total plateforme, commandes totales)
 * - AC2: Tendances vs periode precedente
 * - AC3: Page reservee aux ADMIN (enforced at page level)
 */
export class GetAdminStatsUseCase
  implements UseCase<GetAdminStatsInput, GetAdminStatsOutput>
{
  constructor(private readonly adminRepository: AdminAnalyticsRepository) {}

  async execute(
    input: GetAdminStatsInput
  ): Promise<Result<GetAdminStatsOutput>> {
    // Parse period (default to LAST_30_DAYS)
    const periodType = input.period ?? 'LAST_30_DAYS';
    const periodResult = TimePeriod.create(periodType);

    if (periodResult.isFailure) {
      return Result.fail(`Type de periode invalide: ${periodType}`);
    }

    const period = periodResult.value;

    try {
      const stats: AdminPlatformStats =
        await this.adminRepository.getPlatformStats(period);

      // Calculate percentage changes
      const creatorsChange = calculatePercentageChange(
        stats.totalCreators,
        stats.previousCreators
      );
      const revenueChange = calculatePercentageChange(
        stats.totalPlatformRevenue,
        stats.previousPlatformRevenue
      );
      const ordersChange = calculatePercentageChange(
        stats.totalOrders,
        stats.previousOrders
      );
      const newCreatorsChange = calculatePercentageChange(
        stats.newCreators,
        stats.previousNewCreators
      );

      return Result.ok<GetAdminStatsOutput>({
        totalCreators: stats.totalCreators,
        creatorsChange,
        totalPlatformRevenue: stats.totalPlatformRevenue,
        revenueChange,
        subscriptionRevenue: stats.subscriptionRevenue,
        subscriptionMRR: stats.subscriptionMRR,
        commissionRevenue: stats.commissionRevenue,
        totalOrders: stats.totalOrders,
        ordersChange,
        newCreators: stats.newCreators,
        newCreatorsChange,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      return Result.fail(
        `Erreur lors de la recuperation des statistiques admin: ${message}`
      );
    }
  }
}
