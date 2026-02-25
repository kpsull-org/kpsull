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
    it.each([
      {
        label: 'same email addresses',
        email1: 'test@example.com',
        email2: 'test@example.com',
        expected: true,
      },
      {
        label: 'same email regardless of case',
        email1: 'Test@Example.com',
        email2: 'test@example.com',
        expected: true,
      },
      {
        label: 'different emails',
        email1: 'test1@example.com',
        email2: 'test2@example.com',
        expected: false,
      },
    ])('should return $expected for $label', ({ email1, email2, expected }) => {
      const e1 = Email.create(email1).value;
      const e2 = Email.create(email2).value;

      expect(e1.equals(e2)).toBe(expected);
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
