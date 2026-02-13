import { Result } from '@/shared/domain';
import type { UseCase } from '@/shared/application/use-case.interface';
import type { CreatorOverviewRepository, CreatorOverviewStats } from '../ports';

export interface GetCreatorOverviewInput {
  creatorId: string;
  year: number;
}

export type GetCreatorOverviewOutput = CreatorOverviewStats;

export class GetCreatorOverviewUseCase
  implements UseCase<GetCreatorOverviewInput, GetCreatorOverviewOutput>
{
  constructor(private readonly overviewRepository: CreatorOverviewRepository) {}

  async execute(
    input: GetCreatorOverviewInput,
  ): Promise<Result<GetCreatorOverviewOutput>> {
    if (!input.creatorId || input.creatorId.trim() === '') {
      return Result.fail('Creator ID est requis');
    }

    const stats = await this.overviewRepository.getOverview(
      input.creatorId,
      input.year,
    );
    return Result.ok(stats);
  }
}
