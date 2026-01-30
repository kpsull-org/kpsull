import { describe, it, expect } from 'vitest';
import { Siret } from '../siret.vo';

// Known valid SIRET numbers (Luhn checksum validated)
const VALID_SIRET = '80295478500028'; // Example valid SIRET
const VALID_SIRET_2 = '44306184100043'; // Another valid SIRET

describe('Siret Value Object', () => {
  describe('create', () => {
    it('should create a valid SIRET with 14 digits', () => {
      const result = Siret.create(VALID_SIRET);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(VALID_SIRET);
    });

    it('should create a valid SIRET with spaces (normalized)', () => {
      const result = Siret.create('802 954 785 00028');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(VALID_SIRET);
    });

    it('should fail when SIRET is empty', () => {
      const result = Siret.create('');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Le SIRET est requis');
    });

    it('should fail when SIRET has less than 14 digits', () => {
      const result = Siret.create('1234567890123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('14 chiffres');
    });

    it('should fail when SIRET has more than 14 digits', () => {
      const result = Siret.create('123456789012345');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('14 chiffres');
    });

    it('should fail when SIRET contains non-numeric characters', () => {
      const result = Siret.create('1234567890123A');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('chiffres uniquement');
    });

    it('should fail Luhn checksum validation for invalid SIRET', () => {
      // Invalid Luhn checksum
      const result = Siret.create('12345678901235');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should pass Luhn checksum validation for valid SIRET', () => {
      // 80295478500028 is a valid SIRET (Luhn check passes)
      const result = Siret.create('80295478500028');

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('SIREN extraction', () => {
    it('should extract SIREN (first 9 digits)', () => {
      const result = Siret.create('80295478500028');

      expect(result.isSuccess).toBe(true);
      expect(result.value.siren).toBe('802954785');
    });
  });

  describe('NIC extraction', () => {
    it('should extract NIC (last 5 digits)', () => {
      const result = Siret.create('80295478500028');

      expect(result.isSuccess).toBe(true);
      expect(result.value.nic).toBe('00028');
    });
  });

  describe('formatted', () => {
    it('should return formatted SIRET with spaces', () => {
      const result = Siret.create('80295478500028');

      expect(result.isSuccess).toBe(true);
      expect(result.value.formatted).toBe('802 954 785 00028');
    });
  });

  describe('equality', () => {
    it('should be equal to another SIRET with same value', () => {
      const siret1 = Siret.create('80295478500028').value;
      const siret2 = Siret.create('80295478500028').value;

      expect(siret1.equals(siret2)).toBe(true);
    });

    it('should not be equal to another SIRET with different value', () => {
      const siret1 = Siret.create(VALID_SIRET).value;
      const siret2 = Siret.create(VALID_SIRET_2).value;

      expect(siret1.equals(siret2)).toBe(false);
    });
  });
});
