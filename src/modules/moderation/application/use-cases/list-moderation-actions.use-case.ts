/**
 * List Moderation Actions Use Case
 * Story 11-5: Controle contenu
 */

import type { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import type {
  IModerationRepository,
  ListModerationActionsParams,
  ListModerationActionsResult,
} from '../ports/moderation.repository.interface';

export class ListModerationActionsUseCase
  implements UseCase<ListModerationActionsParams, ListModerationActionsResult>
{
  constructor(private readonly moderationRepository: IModerationRepository) {}

  async execute(
    input: ListModerationActionsParams
  ): Promise<Result<ListModerationActionsResult>> {
    const result =
      await this.moderationRepository.listModerationActions(input);
    return Result.ok(result);
  }
}
