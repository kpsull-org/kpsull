/**
 * Moderate Content Use Case
 * Story 11-5: Controle contenu
 *
 * Business rules:
 * - Only PENDING content can be moderated
 * - Moderator cannot moderate their own content
 * - Valid actions: APPROVE, HIDE, DELETE
 */

import type { UseCase } from '@/shared/application/use-case.interface';
import { Result } from '@/shared/domain/result';
import type {
  IModerationRepository,
  ModerateContentParams,
} from '../ports/moderation.repository.interface';
import type { FlaggedContent } from '../../domain/entities/flagged-content.entity';
import { isValidModerationAction } from '../../domain/value-objects/moderation-action.vo';

export interface ModerateContentInput {
  flaggedContentId: string;
  action: string;
  moderatorId: string;
  moderatorName: string;
  moderatorEmail: string;
  note?: string;
}

export class ModerateContentUseCase
  implements UseCase<ModerateContentInput, FlaggedContent>
{
  constructor(private readonly moderationRepository: IModerationRepository) {}

  async execute(input: ModerateContentInput): Promise<Result<FlaggedContent>> {
    // Validate action
    if (!isValidModerationAction(input.action)) {
      return Result.fail(
        `Action invalide: ${input.action}. Actions valides: APPROVE, HIDE, DELETE`
      );
    }

    // Fetch flagged content
    const content = await this.moderationRepository.getFlaggedContentById(
      input.flaggedContentId
    );
    if (!content) {
      return Result.fail('Contenu signale introuvable');
    }

    // Only PENDING content can be moderated
    if (content.status !== 'PENDING') {
      return Result.fail(
        `Ce contenu a deja ete modere (statut: ${content.status})`
      );
    }

    // Moderator cannot moderate their own content
    if (content.creatorId === input.moderatorId) {
      return Result.fail(
        'Un moderateur ne peut pas moderer son propre contenu'
      );
    }

    // Execute moderation
    const params: ModerateContentParams = {
      flaggedContentId: input.flaggedContentId,
      action: input.action as ModerateContentParams['action'],
      moderatorId: input.moderatorId,
      moderatorName: input.moderatorName,
      moderatorEmail: input.moderatorEmail,
      note: input.note,
    };

    const moderated = await this.moderationRepository.moderateContent(params);
    return Result.ok(moderated);
  }
}
