/**
 * List Flagged Content Use Case
 * Story 11-5: Controle contenu
 */

import type { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import type {
  IModerationRepository,
  ListFlaggedContentParams,
  ListFlaggedContentResult,
} from '../ports/moderation.repository.interface';

export class ListFlaggedContentUseCase
  implements UseCase<ListFlaggedContentParams, ListFlaggedContentResult>
{
  constructor(private readonly moderationRepository: IModerationRepository) {}

  async execute(
    input: ListFlaggedContentParams
  ): Promise<Result<ListFlaggedContentResult>> {
    const result = await this.moderationRepository.listFlaggedContent(input);
    return Result.ok(result);
  }
}
