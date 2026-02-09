/**
 * Shared interface representing the minimal shape of a Creator entity
 * used across all creator-related specifications.
 *
 * All creator specifications must use this same type to ensure
 * composability via .and() / .or() / .not() combinators.
 */
export interface CreatorLike {
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
}
