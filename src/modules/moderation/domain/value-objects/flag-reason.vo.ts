/**
 * Flag Reason Value Object
 *
 * Story 11-5: Controle contenu
 *
 * Represents the reason why a content was flagged.
 */

export const FLAG_REASONS = [
  'INAPPROPRIATE_CONTENT',
  'COUNTERFEIT',
  'PROHIBITED_ITEM',
  'MISLEADING_DESCRIPTION',
  'SPAM',
  'OTHER',
] as const;

export type FlagReasonValue = (typeof FLAG_REASONS)[number];

export const FLAG_REASON_LABELS: Record<FlagReasonValue, string> = {
  INAPPROPRIATE_CONTENT: 'Contenu inapproprie',
  COUNTERFEIT: 'Contrefacon',
  PROHIBITED_ITEM: 'Article interdit',
  MISLEADING_DESCRIPTION: 'Description trompeuse',
  SPAM: 'Spam',
  OTHER: 'Autre',
};

export function isValidFlagReason(value: string): value is FlagReasonValue {
  return FLAG_REASONS.includes(value as FlagReasonValue);
}
