import { describe, it, expect } from 'vitest';
import { Email } from '../email.vo';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const result = Email.create('test@example.com');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('test@example.com');
    });

    it('should create email with uppercase letters and normalize to lowercase', () => {
      const result = Email.create('Test@EXAMPLE.com');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('test@example.com');
    });

    describe('invalid email formats', () => {
      it.each([
        { label: 'empty string', input: '', expectedError: 'Email cannot be empty' },
        { label: 'whitespace only', input: '   ', expectedError: 'Email cannot be empty' },
        { label: 'no @', input: 'testexample.com', expectedError: 'Invalid email format' },
        { label: 'no domain', input: 'test@', expectedError: 'Invalid email format' },
        { label: 'no local part', input: '@example.com', expectedError: 'Invalid email format' },
        { label: 'spaces', input: 'test @example.com', expectedError: 'Invalid email format' },
      ])('should fail with $label', ({ input, expectedError }) => {
        const result = Email.create(input);

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(expectedError);
      });
    });
  });

  describe('equality', () => {
    it('should be equal for same email addresses', () => {
      const email1 = Email.create('test@example.com').value;
      const email2 = Email.create('test@example.com').value;

      expect(email1.equals(email2)).toBe(true);
    });

    it('should be equal regardless of case', () => {
      const email1 = Email.create('Test@Example.com').value;
      const email2 = Email.create('test@example.com').value;

      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal for different emails', () => {
      const email1 = Email.create('test1@example.com').value;
      const email2 = Email.create('test2@example.com').value;

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('domain extraction', () => {
    it('should extract domain from email', () => {
      const email = Email.create('test@example.com').value;

      expect(email.domain).toBe('example.com');
    });

    it('should extract domain with subdomain', () => {
      const email = Email.create('test@mail.example.com').value;

      expect(email.domain).toBe('mail.example.com');
    });
  });

  describe('local part extraction', () => {
    it('should extract local part from email', () => {
      const email = Email.create('john.doe@example.com').value;

      expect(email.localPart).toBe('john.doe');
    });
  });

  describe('toString', () => {
    it('should return the email string value', () => {
      const email = Email.create('test@example.com').value;

      expect(email.toString()).toBe('test@example.com');
    });
  });
});
