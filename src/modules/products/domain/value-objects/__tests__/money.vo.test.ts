import { describe, it, expect } from 'vitest';
import { Money } from '../money.vo';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create a valid Money from euros', () => {
      // Act
      const result = Money.create(19.99);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.amount).toBe(1999); // Stored in cents
      expect(result.value!.currency).toBe('EUR');
      expect(result.value!.displayAmount).toBe(19.99);
    });

    it('should create Money with custom currency', () => {
      // Act
      const result = Money.create(100, 'USD');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.currency).toBe('USD');
    });

    it('should fail when amount is negative', () => {
      // Act
      const result = Money.create(-10);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('négatif');
    });

    it('should fail when amount is zero', () => {
      // Act
      const result = Money.create(0);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('supérieur à 0');
    });

    it('should fail when amount is NaN', () => {
      // Act
      const result = Money.create(NaN);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nombre');
    });

    it('should round to nearest cent', () => {
      // Act
      const result = Money.create(19.999);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.amount).toBe(2000);
    });
  });

  describe('fromCents', () => {
    it('should create Money directly from cents', () => {
      // Act
      const money = Money.fromCents(1999);

      // Assert
      expect(money.amount).toBe(1999);
      expect(money.displayAmount).toBe(19.99);
    });
  });

  describe('formatted', () => {
    it('should format as French EUR', () => {
      // Arrange
      const money = Money.create(1234.56).value!;

      // Act
      const formatted = money.formatted;

      // Assert
      expect(formatted).toMatch(/1[\s\u202f]234,56/); // May use narrow no-break space
      expect(formatted).toContain('€');
    });
  });

  describe('add', () => {
    it('should add two Money values with same currency', () => {
      // Arrange
      const money1 = Money.create(10).value!;
      const money2 = Money.create(5.50).value!;

      // Act
      const result = money1.add(money2);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.displayAmount).toBe(15.50);
    });

    it('should fail to add Money with different currencies', () => {
      // Arrange
      const money1 = Money.create(10, 'EUR').value!;
      const money2 = Money.create(10, 'USD').value!;

      // Act
      const result = money1.add(money2);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('devises');
    });
  });

  describe('equality', () => {
    it('should be equal when amount and currency match', () => {
      // Arrange
      const money1 = Money.create(19.99).value!;
      const money2 = Money.create(19.99).value!;

      // Assert
      expect(money1.equals(money2)).toBe(true);
    });

    it('should not be equal when amounts differ', () => {
      // Arrange
      const money1 = Money.create(19.99).value!;
      const money2 = Money.create(20.00).value!;

      // Assert
      expect(money1.equals(money2)).toBe(false);
    });

    it('should not be equal when currencies differ', () => {
      // Arrange
      const money1 = Money.create(19.99, 'EUR').value!;
      const money2 = Money.create(19.99, 'USD').value!;

      // Assert
      expect(money1.equals(money2)).toBe(false);
    });
  });
});
