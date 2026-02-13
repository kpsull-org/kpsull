import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { AdminAnalyticsRepository, MonthlyRevenueDataPoint } from '../ports';

export interface GetAdminMonthlyRevenueInput {
  year: number;
}

export interface GetAdminMonthlyRevenueOutput {
  revenueByMonth: MonthlyRevenueDataPoint[];
}

export class GetAdminMonthlyRevenueUseCase
  implements UseCase<GetAdminMonthlyRevenueInput, GetAdminMonthlyRevenueOutput>
{
  constructor(private readonly adminRepository: AdminAnalyticsRepository) {}

  async execute(
    input: GetAdminMonthlyRevenueInput,
  ): Promise<Result<GetAdminMonthlyRevenueOutput>> {
    const revenueByMonth = await this.adminRepository.getMonthlyRevenue(input.year);
    return Result.ok({ revenueByMonth });
  }
}
