/**
 * Moderation Status Value Object
 *
 * Story 11-5: Controle contenu
 *
 * Represents the moderation status of a flagged content.
 */

export const MODERATION_STATUSES = [
  'PENDING',
  'APPROVED',
  'HIDDEN',
  'DELETED',
] as const;

export type ModerationStatusValue = (typeof MODERATION_STATUSES)[number];

export const MODERATION_STATUS_LABELS: Record<ModerationStatusValue, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuve',
  HIDDEN: 'Masque',
  DELETED: 'Supprime',
};

export function isValidModerationStatus(value: string): value is ModerationStatusValue {
  return MODERATION_STATUSES.includes(value as ModerationStatusValue);
}
