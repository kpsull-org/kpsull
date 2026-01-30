/**
 * Moderation Repository Interface
 *
 * Story 11-5: Controle contenu
 *
 * Port for moderation data access.
 */

import type { FlaggedContent } from '../../domain/entities/flagged-content.entity';
import type { ModerationAction } from '../../domain/entities/moderation-action.entity';
import type { ModerationStatusValue } from '../../domain/value-objects/moderation-status.vo';
import type { ModerationActionValue } from '../../domain/value-objects/moderation-action.vo';

export interface ListFlaggedContentParams {
  status?: ModerationStatusValue;
  page?: number;
  pageSize?: number;
}

export interface ListFlaggedContentResult {
  items: FlaggedContent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListModerationActionsParams {
  page?: number;
  pageSize?: number;
}

export interface ListModerationActionsResult {
  items: ModerationAction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ModerateContentParams {
  flaggedContentId: string;
  action: ModerationActionValue;
  moderatorId: string;
  moderatorName: string;
  moderatorEmail: string;
  note?: string;
}

export interface IModerationRepository {
  listFlaggedContent(params: ListFlaggedContentParams): Promise<ListFlaggedContentResult>;
  getFlaggedContentById(id: string): Promise<FlaggedContent | null>;
  moderateContent(params: ModerateContentParams): Promise<FlaggedContent>;
  listModerationActions(params: ListModerationActionsParams): Promise<ListModerationActionsResult>;
}
