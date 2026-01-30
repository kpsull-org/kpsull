/**
 * Moderation Action Value Object
 *
 * Story 11-5: Controle contenu
 *
 * Represents a moderation action type.
 */

export const MODERATION_ACTIONS = [
  'APPROVE',
  'HIDE',
  'DELETE',
] as const;

export type ModerationActionValue = (typeof MODERATION_ACTIONS)[number];

export const MODERATION_ACTION_LABELS: Record<ModerationActionValue, string> = {
  APPROVE: 'Approuver',
  HIDE: 'Masquer',
  DELETE: 'Supprimer',
};

export function isValidModerationAction(value: string): value is ModerationActionValue {
  return MODERATION_ACTIONS.includes(value as ModerationActionValue);
}
