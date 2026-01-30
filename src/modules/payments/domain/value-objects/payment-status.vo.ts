import { ValueObject, Result } from '@/shared/domain';

export type PaymentStatusValue =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED';

interface PaymentStatusProps {
  value: PaymentStatusValue;
}

/**
 * PaymentStatus Value Object
 *
 * Represents the status of a payment in its lifecycle.
 * PENDING -> PROCESSING -> SUCCEEDED -> REFUNDED
 *                       -> FAILED
 */
export class PaymentStatus extends ValueObject<PaymentStatusProps> {
  private constructor(props: PaymentStatusProps) {
    super(props);
  }

  get value(): PaymentStatusValue {
    return this.props.value;
  }

  get isPending(): boolean {
    return this.value === 'PENDING';
  }

  get isProcessing(): boolean {
    return this.value === 'PROCESSING';
  }

  get isSucceeded(): boolean {
    return this.value === 'SUCCEEDED';
  }

  get isFailed(): boolean {
    return this.value === 'FAILED';
  }

  get isRefunded(): boolean {
    return this.value === 'REFUNDED';
  }

  /**
   * Can transition to PROCESSING status
   */
  get canBeProcessed(): boolean {
    return this.isPending;
  }

  /**
   * Can transition to REFUNDED status
   */
  get canBeRefunded(): boolean {
    return this.isSucceeded;
  }

  /**
   * Is this a final state (no more transitions possible)
   */
  get isFinal(): boolean {
    return this.isFailed || this.isRefunded;
  }

  static pending(): PaymentStatus {
    return new PaymentStatus({ value: 'PENDING' });
  }

  static processing(): PaymentStatus {
    return new PaymentStatus({ value: 'PROCESSING' });
  }

  static succeeded(): PaymentStatus {
    return new PaymentStatus({ value: 'SUCCEEDED' });
  }

  static failed(): PaymentStatus {
    return new PaymentStatus({ value: 'FAILED' });
  }

  static refunded(): PaymentStatus {
    return new PaymentStatus({ value: 'REFUNDED' });
  }

  static fromString(value: string): Result<PaymentStatus> {
    const validStatuses: PaymentStatusValue[] = [
      'PENDING',
      'PROCESSING',
      'SUCCEEDED',
      'FAILED',
      'REFUNDED',
    ];

    if (!validStatuses.includes(value as PaymentStatusValue)) {
      return Result.fail(`Statut de paiement invalide: ${value}`);
    }

    return Result.ok(new PaymentStatus({ value: value as PaymentStatusValue }));
  }
}
