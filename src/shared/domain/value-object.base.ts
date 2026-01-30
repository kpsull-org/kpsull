/**
 * Base class for Value Objects in Domain-Driven Design.
 *
 * Value Objects are immutable objects that are defined by their attributes
 * rather than their identity. They have no unique identifier and are
 * considered equal if all their properties are equal.
 *
 * @example
 * ```typescript
 * interface EmailProps {
 *   value: string;
 * }
 *
 * class Email extends ValueObject<EmailProps> {
 *   private constructor(props: EmailProps) {
 *     super(props);
 *   }
 *
 *   static create(email: string): Email {
 *     // validation logic
 *     return new Email({ value: email });
 *   }
 * }
 * ```
 */
export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Compares two Value Objects for equality based on their properties.
   * Two Value Objects are equal if all their properties are equal.
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (!vo) {
      return false;
    }
    if (vo === this) {
      return true;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Returns a shallow clone of the properties.
   * Use this for creating modified copies of Value Objects.
   */
  protected getProps(): T {
    return { ...this.props };
  }
}
