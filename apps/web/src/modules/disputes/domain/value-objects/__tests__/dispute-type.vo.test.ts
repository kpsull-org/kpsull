import { describe, it, expect } from 'vitest';
import { DisputeType } from '../dispute-type.vo';

describe('DisputeType Value Object', () => {
  describe('factory methods', () => {
    it('should create NOT_RECEIVED type', () => {
      // Act
      const type = DisputeType.notReceived();

      // Assert
      expect(type.value).toBe('NOT_RECEIVED');
      expect(type.isNotReceived).toBe(true);
      expect(type.isDamaged).toBe(false);
      expect(type.isWrongItem).toBe(false);
      expect(type.isOther).toBe(false);
    });

    it('should create DAMAGED type', () => {
      // Act
      const type = DisputeType.damaged();

      // Assert
      expect(type.value).toBe('DAMAGED');
      expect(type.isDamaged).toBe(true);
      expect(type.isNotReceived).toBe(false);
    });

    it('should create WRONG_ITEM type', () => {
      // Act
      const type = DisputeType.wrongItem();

      // Assert
      expect(type.value).toBe('WRONG_ITEM');
      expect(type.isWrongItem).toBe(true);
    });

    it('should create OTHER type', () => {
      // Act
      const type = DisputeType.other();

      // Assert
      expect(type.value).toBe('OTHER');
      expect(type.isOther).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create type from valid string', () => {
      // Act
      const result = DisputeType.fromString('DAMAGED');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.value).toBe('DAMAGED');
    });

    it('should fail for invalid type', () => {
      // Act
      const result = DisputeType.fromString('INVALID');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });
  });

  describe('label', () => {
    it('should return French label for NOT_RECEIVED', () => {
      // Act
      const type = DisputeType.notReceived();

      // Assert
      expect(type.label).toBe('Produit non recu');
    });

    it('should return French label for DAMAGED', () => {
      // Act
      const type = DisputeType.damaged();

      // Assert
      expect(type.label).toBe('Produit endommage');
    });
  });

  describe('getAllTypes', () => {
    it('should return all types with labels', () => {
      // Act
      const types = DisputeType.getAllTypes();

      // Assert
      expect(types).toHaveLength(4);
      expect(types[0]).toEqual({
        value: 'NOT_RECEIVED',
        label: 'Produit non recu',
      });
    });
  });

  describe('equality', () => {
    it('should be equal when values match', () => {
      // Arrange
      const type1 = DisputeType.damaged();
      const type2 = DisputeType.damaged();

      // Assert
      expect(type1.equals(type2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      // Arrange
      const type1 = DisputeType.damaged();
      const type2 = DisputeType.other();

      // Assert
      expect(type1.equals(type2)).toBe(false);
    });
  });
});
