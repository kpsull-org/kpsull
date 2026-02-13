import { randomInt } from 'crypto';

export class OTP {
  private static readonly EXPIRY_MINUTES = 10;

  private constructor(
    public readonly code: string,
    public readonly expiresAt: Date
  ) {}

  static generate(): OTP {
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000);
    return new OTP(code, expiresAt);
  }

  static fromExisting(code: string, expiresAt: Date): OTP {
    return new OTP(code, expiresAt);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  matches(input: string): boolean {
    return this.code === input;
  }
}
