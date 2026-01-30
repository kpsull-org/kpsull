import { ValueObject, Result } from '@/shared/domain';

export type PaymentMethodValue = 'CARD' | 'SEPA' | 'APPLE_PAY' | 'GOOGLE_PAY';

interface PaymentMethodProps {
  value: PaymentMethodValue;
}

const DISPLAY_NAMES: Record<PaymentMethodValue, string> = {
  CARD: 'Carte bancaire',
  SEPA: 'Prélèvement SEPA',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
};

/**
 * PaymentMethod Value Object
 *
 * Represents the method used for payment.
 */
export class PaymentMethod extends ValueObject<PaymentMethodProps> {
  private constructor(props: PaymentMethodProps) {
    super(props);
  }

  get value(): PaymentMethodValue {
    return this.props.value;
  }

  get isCard(): boolean {
    return this.value === 'CARD';
  }

  get isSepa(): boolean {
    return this.value === 'SEPA';
  }

  get isApplePay(): boolean {
    return this.value === 'APPLE_PAY';
  }

  get isGooglePay(): boolean {
    return this.value === 'GOOGLE_PAY';
  }

  /**
   * Check if this is a digital wallet (Apple Pay or Google Pay)
   */
  get isDigitalWallet(): boolean {
    return this.isApplePay || this.isGooglePay;
  }

  /**
   * Get the display name for UI
   */
  get displayName(): string {
    return DISPLAY_NAMES[this.value];
  }

  static card(): PaymentMethod {
    return new PaymentMethod({ value: 'CARD' });
  }

  static sepa(): PaymentMethod {
    return new PaymentMethod({ value: 'SEPA' });
  }

  static applePay(): PaymentMethod {
    return new PaymentMethod({ value: 'APPLE_PAY' });
  }

  static googlePay(): PaymentMethod {
    return new PaymentMethod({ value: 'GOOGLE_PAY' });
  }

  static fromString(value: string): Result<PaymentMethod> {
    const validMethods: PaymentMethodValue[] = [
      'CARD',
      'SEPA',
      'APPLE_PAY',
      'GOOGLE_PAY',
    ];

    if (!value || !validMethods.includes(value as PaymentMethodValue)) {
      return Result.fail(`Méthode de paiement invalide: ${value}`);
    }

    return Result.ok(new PaymentMethod({ value: value as PaymentMethodValue }));
  }
}
