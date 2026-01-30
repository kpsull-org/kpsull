import { describe, it, expect } from 'vitest';
import { PaymentMethod } from '../payment-method.vo';

describe('PaymentMethod Value Object', () => {
  describe('factory methods', () => {
    it('should create CARD payment method', () => {
      const method = PaymentMethod.card();

      expect(method.value).toBe('CARD');
      expect(method.isCard).toBe(true);
    });

    it('should create SEPA payment method', () => {
      const method = PaymentMethod.sepa();

      expect(method.value).toBe('SEPA');
      expect(method.isSepa).toBe(true);
    });

    it('should create APPLE_PAY payment method', () => {
      const method = PaymentMethod.applePay();

      expect(method.value).toBe('APPLE_PAY');
      expect(method.isApplePay).toBe(true);
    });

    it('should create GOOGLE_PAY payment method', () => {
      const method = PaymentMethod.googlePay();

      expect(method.value).toBe('GOOGLE_PAY');
      expect(method.isGooglePay).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create from valid method string', () => {
      const result = PaymentMethod.fromString('CARD');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('CARD');
    });

    it('should create from SEPA string', () => {
      const result = PaymentMethod.fromString('SEPA');

      expect(result.isSuccess).toBe(true);
      expect(result.value?.value).toBe('SEPA');
    });

    it('should fail for invalid method', () => {
      const result = PaymentMethod.fromString('BITCOIN');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should fail for empty string', () => {
      const result = PaymentMethod.fromString('');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('state checks', () => {
    it('should identify card correctly', () => {
      const method = PaymentMethod.card();

      expect(method.isCard).toBe(true);
      expect(method.isSepa).toBe(false);
      expect(method.isApplePay).toBe(false);
      expect(method.isGooglePay).toBe(false);
    });

    it('should identify digital wallet methods', () => {
      expect(PaymentMethod.applePay().isDigitalWallet).toBe(true);
      expect(PaymentMethod.googlePay().isDigitalWallet).toBe(true);
      expect(PaymentMethod.card().isDigitalWallet).toBe(false);
      expect(PaymentMethod.sepa().isDigitalWallet).toBe(false);
    });
  });

  describe('displayName', () => {
    it('should return correct display name for CARD', () => {
      const method = PaymentMethod.card();

      expect(method.displayName).toBe('Carte bancaire');
    });

    it('should return correct display name for SEPA', () => {
      const method = PaymentMethod.sepa();

      expect(method.displayName).toBe('Prélèvement SEPA');
    });

    it('should return correct display name for APPLE_PAY', () => {
      const method = PaymentMethod.applePay();

      expect(method.displayName).toBe('Apple Pay');
    });

    it('should return correct display name for GOOGLE_PAY', () => {
      const method = PaymentMethod.googlePay();

      expect(method.displayName).toBe('Google Pay');
    });
  });

  describe('equals', () => {
    it('should be equal to same method', () => {
      const method1 = PaymentMethod.card();
      const method2 = PaymentMethod.card();

      expect(method1.equals(method2)).toBe(true);
    });

    it('should not be equal to different method', () => {
      const method1 = PaymentMethod.card();
      const method2 = PaymentMethod.sepa();

      expect(method1.equals(method2)).toBe(false);
    });
  });
});
