import { ValueObject, Result } from '@/shared/domain';

export type DisputeTypeValue = 'NOT_RECEIVED' | 'DAMAGED' | 'WRONG_ITEM' | 'OTHER';

interface DisputeTypeProps {
  value: DisputeTypeValue;
}

/**
 * DisputeType Value Object
 *
 * Represents the type/reason of a dispute filed by a customer.
 *
 * Types:
 * - NOT_RECEIVED: Product was not received
 * - DAMAGED: Product arrived damaged
 * - WRONG_ITEM: Wrong product was delivered
 * - OTHER: Other issue not covered above
 */
export class DisputeType extends ValueObject<DisputeTypeProps> {
  private static readonly VALID_TYPES: DisputeTypeValue[] = [
    'NOT_RECEIVED',
    'DAMAGED',
    'WRONG_ITEM',
    'OTHER',
  ];

  private static readonly TYPE_LABELS: Record<DisputeTypeValue, string> = {
    NOT_RECEIVED: 'Produit non recu',
    DAMAGED: 'Produit endommage',
    WRONG_ITEM: 'Mauvais produit',
    OTHER: 'Autre probleme',
  };

  private constructor(props: DisputeTypeProps) {
    super(props);
  }

  get value(): DisputeTypeValue {
    return this.props.value;
  }

  get label(): string {
    return DisputeType.TYPE_LABELS[this.props.value];
  }

  get isNotReceived(): boolean {
    return this.value === 'NOT_RECEIVED';
  }

  get isDamaged(): boolean {
    return this.value === 'DAMAGED';
  }

  get isWrongItem(): boolean {
    return this.value === 'WRONG_ITEM';
  }

  get isOther(): boolean {
    return this.value === 'OTHER';
  }

  static notReceived(): DisputeType {
    return new DisputeType({ value: 'NOT_RECEIVED' });
  }

  static damaged(): DisputeType {
    return new DisputeType({ value: 'DAMAGED' });
  }

  static wrongItem(): DisputeType {
    return new DisputeType({ value: 'WRONG_ITEM' });
  }

  static other(): DisputeType {
    return new DisputeType({ value: 'OTHER' });
  }

  static fromString(value: string): Result<DisputeType> {
    if (!DisputeType.VALID_TYPES.includes(value as DisputeTypeValue)) {
      return Result.fail(`Type de litige invalide: ${value}`);
    }

    return Result.ok(new DisputeType({ value: value as DisputeTypeValue }));
  }

  static getAllTypes(): Array<{ value: DisputeTypeValue; label: string }> {
    return DisputeType.VALID_TYPES.map((type) => ({
      value: type,
      label: DisputeType.TYPE_LABELS[type],
    }));
  }
}
