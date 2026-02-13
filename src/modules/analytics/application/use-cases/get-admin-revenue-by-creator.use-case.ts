import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { AdminAnalyticsRepository, CreatorRevenueBreakdown } from '../ports';

export interface GetAdminRevenueByCreatorInput {
  limit?: number;
}

export interface GetAdminRevenueByCreatorOutput {
  creators: CreatorRevenueBreakdown[];
}

export class GetAdminRevenueByCreatorUseCase
  implements UseCase<GetAdminRevenueByCreatorInput, GetAdminRevenueByCreatorOutput>
{
  constructor(private readonly adminRepository: AdminAnalyticsRepository) {}

  async execute(
    input: GetAdminRevenueByCreatorInput,
  ): Promise<Result<GetAdminRevenueByCreatorOutput>> {
    const limit = Math.max(1, input.limit ?? 10);
    const creators = await this.adminRepository.getRevenueByCreator(limit);
    return Result.ok({ creators });
  }
}
