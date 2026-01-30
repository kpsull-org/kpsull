import { ValueObject, Result } from '@/shared/domain';

interface MoneyProps {
  amount: number; // En centimes
  currency: string;
}

/**
 * Money Value Object
 *
 * Represents a monetary amount stored in cents to avoid floating point issues.
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get displayAmount(): number {
    return this.amount / 100;
  }

  get formatted(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.displayAmount);
  }

  /**
   * Create Money from a decimal amount (e.g., 19.99 euros)
   */
  static create(amount: number, currency: string = 'EUR'): Result<Money> {
    if (isNaN(amount)) {
      return Result.fail('Le montant doit être un nombre');
    }

    if (amount < 0) {
      return Result.fail('Le prix ne peut pas être négatif');
    }

    if (amount === 0) {
      return Result.fail('Le prix doit être supérieur à 0');
    }

    // Store in cents to avoid floating point issues
    const amountInCents = Math.round(amount * 100);

    return Result.ok(new Money({ amount: amountInCents, currency }));
  }

  /**
   * Create Money directly from cents
   */
  static fromCents(cents: number, currency: string = 'EUR'): Money {
    return new Money({ amount: cents, currency });
  }

  /**
   * Add another Money value
   */
  add(other: Money): Result<Money> {
    if (this.currency !== other.currency) {
      return Result.fail('Les devises doivent être identiques');
    }

    return Result.ok(
      new Money({
        amount: this.amount + other.amount,
        currency: this.currency,
      })
    );
  }
}
