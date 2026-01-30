import { ValueObject, Result } from '@/shared/domain';

export type DisputeStatusValue = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

interface DisputeStatusProps {
  value: DisputeStatusValue;
}

/**
 * DisputeStatus Value Object
 *
 * Represents the status of a dispute in its lifecycle.
 *
 * Statuses:
 * - OPEN: Dispute has been filed and awaits review
 * - UNDER_REVIEW: Dispute is being investigated
 * - RESOLVED: Dispute has been resolved (refund, replacement, etc.)
 * - CLOSED: Dispute has been closed without action
 */
export class DisputeStatus extends ValueObject<DisputeStatusProps> {
  private static readonly VALID_STATUSES: DisputeStatusValue[] = [
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'CLOSED',
  ];

  private static readonly STATUS_LABELS: Record<DisputeStatusValue, string> = {
    OPEN: 'Ouvert',
    UNDER_REVIEW: 'En cours de traitement',
    RESOLVED: 'Resolu',
    CLOSED: 'Ferme',
  };

  private constructor(props: DisputeStatusProps) {
    super(props);
  }

  get value(): DisputeStatusValue {
    return this.props.value;
  }

  get label(): string {
    return DisputeStatus.STATUS_LABELS[this.props.value];
  }

  get isOpen(): boolean {
    return this.value === 'OPEN';
  }

  get isUnderReview(): boolean {
    return this.value === 'UNDER_REVIEW';
  }

  get isResolved(): boolean {
    return this.value === 'RESOLVED';
  }

  get isClosed(): boolean {
    return this.value === 'CLOSED';
  }

  /**
   * Check if the dispute can be transitioned to review
   */
  get canStartReview(): boolean {
    return this.isOpen;
  }

  /**
   * Check if the dispute can be resolved
   */
  get canResolve(): boolean {
    return this.isOpen || this.isUnderReview;
  }

  /**
   * Check if the dispute can be closed
   */
  get canClose(): boolean {
    return this.isOpen || this.isUnderReview;
  }

  /**
   * Check if the dispute is still active (not resolved or closed)
   */
  get isActive(): boolean {
    return this.isOpen || this.isUnderReview;
  }

  static open(): DisputeStatus {
    return new DisputeStatus({ value: 'OPEN' });
  }

  static underReview(): DisputeStatus {
    return new DisputeStatus({ value: 'UNDER_REVIEW' });
  }

  static resolved(): DisputeStatus {
    return new DisputeStatus({ value: 'RESOLVED' });
  }

  static closed(): DisputeStatus {
    return new DisputeStatus({ value: 'CLOSED' });
  }

  static fromString(value: string): Result<DisputeStatus> {
    if (!DisputeStatus.VALID_STATUSES.includes(value as DisputeStatusValue)) {
      return Result.fail(`Statut de litige invalide: ${value}`);
    }

    return Result.ok(new DisputeStatus({ value: value as DisputeStatusValue }));
  }
}
