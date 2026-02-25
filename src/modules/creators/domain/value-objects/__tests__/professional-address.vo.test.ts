import { describe, it, expect } from 'vitest';
import { ProfessionalAddress } from '../professional-address.vo';

const validBase = {
  street: '10 rue de la Paix',
  city: 'Paris',
  postalCode: '75001',
};

describe('ProfessionalAddress Value Object', () => {
  describe('create', () => {
    it('should create a valid address with all fields', () => {
      const result = ProfessionalAddress.create({ ...validBase, country: 'France' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.street).toBe('10 rue de la Paix');
      expect(result.value.city).toBe('Paris');
      expect(result.value.postalCode).toBe('75001');
      expect(result.value.country).toBe('France');
    });

    it('should create address with default country (France)', () => {
      const result = ProfessionalAddress.create(validBase);

      expect(result.isSuccess).toBe(true);
      expect(result.value.country).toBe('France');
    });

    it('should use default country when empty string is provided', () => {
      const result = ProfessionalAddress.create({ ...validBase, country: '' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.country).toBe('France');
    });

    describe('validation failures', () => {
      it.each([
        { label: 'empty street', input: { ...validBase, street: '' }, expectedError: "L'adresse est requise" },
        { label: 'whitespace-only street', input: { ...validBase, street: '   ' }, expectedError: "L'adresse est requise" },
        { label: 'empty city', input: { ...validBase, city: '' }, expectedError: 'La ville est requise' },
        { label: 'empty postalCode', input: { ...validBase, postalCode: '' }, expectedError: 'Le code postal est requis' },
        { label: 'postalCode too short', input: { ...validBase, postalCode: '7500' }, expectedError: '5 chiffres' },
        { label: 'postalCode with letters', input: { ...validBase, postalCode: '7500A' }, expectedError: '5 chiffres' },
        { label: 'street exceeds max length', input: { ...validBase, street: 'A'.repeat(256) }, expectedError: '255 caractères' },
        { label: 'city exceeds max length', input: { ...validBase, city: 'A'.repeat(101) }, expectedError: '100 caractères' },
      ])('should fail when $label', ({ input, expectedError }) => {
        const result = ProfessionalAddress.create(input);

        expect(result.isFailure).toBe(true);
        expect(result.error).toContain(expectedError);
      });
    });
  });

  describe('formatted', () => {
    it('should return full formatted address', () => {
      const result = ProfessionalAddress.create({ ...validBase, country: 'France' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.formatted).toBe('10 rue de la Paix, 75001 Paris, France');
    });
  });

  describe('oneLine', () => {
    it('should return single line format without country', () => {
      const result = ProfessionalAddress.create(validBase);

      expect(result.isSuccess).toBe(true);
      expect(result.value.oneLine).toBe('10 rue de la Paix, 75001 Paris');
    });
  });

  describe('equality', () => {
    it('should be equal to another address with same values', () => {
      const addr1 = ProfessionalAddress.create(validBase).value;
      const addr2 = ProfessionalAddress.create(validBase).value;

      expect(addr1.equals(addr2)).toBe(true);
    });

    it('should not be equal to address with different street', () => {
      const addr1 = ProfessionalAddress.create(validBase).value;
      const addr2 = ProfessionalAddress.create({
        street: '20 avenue des Champs',
        city: 'Paris',
        postalCode: '75001',
      }).value;

      expect(addr1.equals(addr2)).toBe(false);
    });

    it('should not be equal to address with different city', () => {
      const addr1 = ProfessionalAddress.create(validBase).value;
      const addr2 = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Lyon',
        postalCode: '69001',
      }).value;

      expect(addr1.equals(addr2)).toBe(false);
    });
  });
});
