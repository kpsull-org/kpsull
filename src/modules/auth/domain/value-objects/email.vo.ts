import { ValueObject } from '@/shared/domain/value-object.base';
import { Result } from '@/shared/domain/result';

interface EmailProps {
  value: string;
}

/**
 * Email Value Object
 *
 * Represents a validated email address. Emails are normalized to lowercase
 * and validated against a standard email format.
 *
 * @example
 * ```typescript
 * const emailResult = Email.create('user@example.com');
 * if (emailResult.isSuccess) {
 *   const email = emailResult.value;
 *   console.log(email.value); // 'user@example.com'
 *   console.log(email.domain); // 'example.com'
 * }
 * ```
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  /**
   * Creates a new Email value object
   * @param email - The email string to validate and create
   * @returns Result containing Email or error message
   */
  static create(email: string): Result<Email> {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return Result.fail('Email cannot be empty');
    }

    const normalizedEmail = trimmedEmail.toLowerCase();

    if (!this.isValidFormat(normalizedEmail)) {
      return Result.fail('Invalid email format');
    }

    return Result.ok(new Email({ value: normalizedEmail }));
  }

  private static isValidFormat(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  /**
   * The email address string value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * The domain part of the email (after @)
   */
  get domain(): string {
    return this.props.value.split('@')[1] as string;
  }

  /**
   * The local part of the email (before @)
   */
  get localPart(): string {
    return this.props.value.split('@')[0] as string;
  }

  /**
   * Returns the email string representation
   */
  override toString(): string {
    return this.value;
  }
}
