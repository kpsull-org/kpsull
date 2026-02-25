import { describe, it, expect } from 'vitest';
import { ProfessionalAddress } from '../professional-address.vo';

describe('ProfessionalAddress Value Object', () => {
  describe('create', () => {
    it('should create a valid address with all fields', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.street).toBe('10 rue de la Paix');
      expect(result.value.city).toBe('Paris');
      expect(result.value.postalCode).toBe('75001');
      expect(result.value.country).toBe('France');
    });

    it('should create address with default country (France)', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.country).toBe('France');
    });

    it('should use default country when empty string is provided', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: '',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.country).toBe('France');
    });

    it('should fail when street is empty', () => {
      const result = ProfessionalAddress.create({
        street: '',
        city: 'Paris',
        postalCode: '75001',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("L'adresse est requise");
    });

    it('should fail when street is only whitespace', () => {
      const result = ProfessionalAddress.create({
        street: '   ',
        city: 'Paris',
        postalCode: '75001',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("L'adresse est requise");
    });

    it('should fail when city is empty', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: '',
        postalCode: '75001',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('La ville est requise');
    });

    it('should fail when postalCode is empty', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Le code postal est requis');
    });

    it('should fail when postalCode is not 5 digits', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '7500',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('5 chiffres');
    });

    it('should fail when postalCode contains letters', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '7500A',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('5 chiffres');
    });

    it('should fail when street exceeds max length', () => {
      const result = ProfessionalAddress.create({
        street: 'A'.repeat(256),
        city: 'Paris',
        postalCode: '75001',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('255 caractères');
    });

    it('should fail when city exceeds max length', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'A'.repeat(101),
        postalCode: '75001',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('100 caractères');
    });
  });

  describe('formatted', () => {
    it('should return full formatted address', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.formatted).toBe('10 rue de la Paix, 75001 Paris, France');
    });
  });

  describe('oneLine', () => {
    it('should return single line format without country', () => {
      const result = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.oneLine).toBe('10 rue de la Paix, 75001 Paris');
    });
  });

  describe('equality', () => {
    it('should be equal to another address with same values', () => {
      const addr1 = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
      }).value;
      const addr2 = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
      }).value;

      expect(addr1.equals(addr2)).toBe(true);
    });

    it('should not be equal to address with different street', () => {
      const addr1 = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
      }).value;
      const addr2 = ProfessionalAddress.create({
        street: '20 avenue des Champs',
        city: 'Paris',
        postalCode: '75001',
      }).value;

      expect(addr1.equals(addr2)).toBe(false);
    });

    it('should not be equal to address with different city', () => {
      const addr1 = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
      }).value;
      const addr2 = ProfessionalAddress.create({
        street: '10 rue de la Paix',
        city: 'Lyon',
        postalCode: '69001',
      }).value;

      expect(addr1.equals(addr2)).toBe(false);
    });
  });
});
