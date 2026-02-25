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

    it('should fail with empty string', () => {
      const result = Email.create('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email cannot be empty');
    });

    it('should fail with invalid email format - no @', () => {
      const result = Email.create('testexample.com');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with invalid email format - no domain', () => {
      const result = Email.create('test@');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with invalid email format - no local part', () => {
      const result = Email.create('@example.com');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with invalid email format - spaces', () => {
      const result = Email.create('test @example.com');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email format');
    });

    it('should fail with whitespace only', () => {
      const result = Email.create('   ');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email cannot be empty');
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
