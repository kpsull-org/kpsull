import { ValueObject, Result } from '@/shared/domain';

export type ReturnReasonValue =
  | 'CHANGED_MIND'
  | 'DEFECTIVE'
  | 'NOT_AS_DESCRIBED'
  | 'OTHER';

interface ReturnReasonProps {
  value: ReturnReasonValue;
}

/**
 * ReturnReason Value Object
 *
 * Represents the reason for a return request.
 * Different reasons may have different processing requirements.
 */
export class ReturnReason extends ValueObject<ReturnReasonProps> {
  private static readonly LABELS: Record<ReturnReasonValue, string> = {
    CHANGED_MIND: "J'ai change d'avis",
    DEFECTIVE: 'Produit defectueux',
    NOT_AS_DESCRIBED: 'Produit non conforme a la description',
    OTHER: 'Autre raison',
  };

  private constructor(props: ReturnReasonProps) {
    super(props);
  }

  get value(): ReturnReasonValue {
    return this.props.value;
  }

  get label(): string {
    return ReturnReason.LABELS[this.value];
  }

  get isChangedMind(): boolean {
    return this.value === 'CHANGED_MIND';
  }

  get isDefective(): boolean {
    return this.value === 'DEFECTIVE';
  }

  get isNotAsDescribed(): boolean {
    return this.value === 'NOT_AS_DESCRIBED';
  }

  get isOther(): boolean {
    return this.value === 'OTHER';
  }

  /**
   * Whether this reason qualifies for immediate refund
   * (defective or not as described)
   */
  get qualifiesForImmediateRefund(): boolean {
    return this.isDefective || this.isNotAsDescribed;
  }

  /**
   * Whether the customer is responsible for return shipping
   */
  get customerPaysReturnShipping(): boolean {
    return this.isChangedMind;
  }

  static changedMind(): ReturnReason {
    return new ReturnReason({ value: 'CHANGED_MIND' });
  }

  static defective(): ReturnReason {
    return new ReturnReason({ value: 'DEFECTIVE' });
  }

  static notAsDescribed(): ReturnReason {
    return new ReturnReason({ value: 'NOT_AS_DESCRIBED' });
  }

  static other(): ReturnReason {
    return new ReturnReason({ value: 'OTHER' });
  }

  static fromString(value: string): Result<ReturnReason> {
    const validReasons: ReturnReasonValue[] = [
      'CHANGED_MIND',
      'DEFECTIVE',
      'NOT_AS_DESCRIBED',
      'OTHER',
    ];

    if (!validReasons.includes(value as ReturnReasonValue)) {
      return Result.fail(`Raison de retour invalide: ${value}`);
    }

    return Result.ok(new ReturnReason({ value: value as ReturnReasonValue }));
  }

  /**
   * Get all available return reasons with their labels
   */
  static getAllReasons(): Array<{ value: ReturnReasonValue; label: string }> {
    return (Object.keys(ReturnReason.LABELS) as ReturnReasonValue[]).map((value) => ({
      value,
      label: ReturnReason.LABELS[value],
    }));
  }
}
