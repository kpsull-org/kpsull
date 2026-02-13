import { describe, it, expect } from "vitest";
import { ValueObject } from "../value-object.base";

// Test implementation of ValueObject
interface EmailProps {
  value: string;
}

class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    return new Email({ value: email });
  }
}

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  static create(amount: number, currency: string): Money {
    return new Money({ amount, currency });
  }
}

describe("ValueObject", () => {
  describe("equality", () => {
    it("should be equal when props are the same", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should not be equal when props are different", () => {
      const email1 = Email.create("test1@example.com");
      const email2 = Email.create("test2@example.com");

      expect(email1.equals(email2)).toBe(false);
    });

    it("should be equal to itself", () => {
      const email = Email.create("test@example.com");

      expect(email.equals(email)).toBe(true);
    });

    it("should not be equal to undefined", () => {
      const email = Email.create("test@example.com");

      expect(email.equals(undefined)).toBe(false);
    });

    it("should compare complex objects correctly", () => {
      const money1 = Money.create(100, "EUR");
      const money2 = Money.create(100, "EUR");
      const money3 = Money.create(100, "USD");

      expect(money1.equals(money2)).toBe(true);
      expect(money1.equals(money3)).toBe(false);
    });
  });

  describe("immutability", () => {
    it("should have immutable props", () => {
      const email = Email.create("test@example.com");

      // TypeScript prevents this, but we can verify the object is frozen
      expect(Object.isFrozen((email as unknown as { props: EmailProps }).props)).toBe(
        true
      );
    });
  });

  describe("getProps", () => {
    it("should return a shallow clone of props", () => {
      const money = Money.create(100, "EUR");
      const cloned = (money as unknown as { getProps: () => MoneyProps }).getProps();

      expect(cloned.amount).toBe(100);
      expect(cloned.currency).toBe("EUR");
      // Should be a copy, not the same reference
      expect(cloned).not.toBe((money as unknown as { props: MoneyProps }).props);
    });
  });

  describe("value access", () => {
    it("should expose value through getter", () => {
      const email = Email.create("test@example.com");

      expect(email.value).toBe("test@example.com");
    });

    it("should expose multiple properties through getters", () => {
      const money = Money.create(100, "EUR");

      expect(money.amount).toBe(100);
      expect(money.currency).toBe("EUR");
    });
  });
});
