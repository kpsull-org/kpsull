import { ValueObject, Result } from '@/shared/domain';

export type ReturnStatusValue =
  | 'REQUESTED'
  | 'APPROVED'
  | 'SHIPPED_BACK'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'REJECTED';

interface ReturnStatusProps {
  value: ReturnStatusValue;
}

/**
 * ReturnStatus Value Object
 *
 * Represents the status of a return request in its lifecycle.
 * REQUESTED -> APPROVED -> SHIPPED_BACK -> RECEIVED -> REFUNDED
 *           -> REJECTED
 */
export class ReturnStatus extends ValueObject<ReturnStatusProps> {
  private constructor(props: ReturnStatusProps) {
    super(props);
  }

  get value(): ReturnStatusValue {
    return this.props.value;
  }

  get isRequested(): boolean {
    return this.value === 'REQUESTED';
  }

  get isApproved(): boolean {
    return this.value === 'APPROVED';
  }

  get isShippedBack(): boolean {
    return this.value === 'SHIPPED_BACK';
  }

  get isReceived(): boolean {
    return this.value === 'RECEIVED';
  }

  get isRefunded(): boolean {
    return this.value === 'REFUNDED';
  }

  get isRejected(): boolean {
    return this.value === 'REJECTED';
  }

  /**
   * Can transition to APPROVED status
   */
  get canBeApproved(): boolean {
    return this.isRequested;
  }

  /**
   * Can transition to REJECTED status
   */
  get canBeRejected(): boolean {
    return this.isRequested;
  }

  /**
   * Can transition to SHIPPED_BACK status
   */
  get canBeShippedBack(): boolean {
    return this.isApproved;
  }

  /**
   * Can transition to RECEIVED status
   */
  get canBeReceived(): boolean {
    return this.isShippedBack;
  }

  /**
   * Can transition to REFUNDED status
   */
  get canBeRefunded(): boolean {
    return this.isReceived;
  }

  /**
   * Is this a final state (no more transitions possible)
   */
  get isFinal(): boolean {
    return this.isRefunded || this.isRejected;
  }

  /**
   * Is this return still in progress (not finalized)
   */
  get isInProgress(): boolean {
    return !this.isFinal;
  }

  static requested(): ReturnStatus {
    return new ReturnStatus({ value: 'REQUESTED' });
  }

  static approved(): ReturnStatus {
    return new ReturnStatus({ value: 'APPROVED' });
  }

  static shippedBack(): ReturnStatus {
    return new ReturnStatus({ value: 'SHIPPED_BACK' });
  }

  static received(): ReturnStatus {
    return new ReturnStatus({ value: 'RECEIVED' });
  }

  static refunded(): ReturnStatus {
    return new ReturnStatus({ value: 'REFUNDED' });
  }

  static rejected(): ReturnStatus {
    return new ReturnStatus({ value: 'REJECTED' });
  }

  static fromString(value: string): Result<ReturnStatus> {
    const validStatuses: ReturnStatusValue[] = [
      'REQUESTED',
      'APPROVED',
      'SHIPPED_BACK',
      'RECEIVED',
      'REFUNDED',
      'REJECTED',
    ];

    if (!validStatuses.includes(value as ReturnStatusValue)) {
      return Result.fail(`Statut de retour invalide: ${value}`);
    }

    return Result.ok(new ReturnStatus({ value: value as ReturnStatusValue }));
  }
}
