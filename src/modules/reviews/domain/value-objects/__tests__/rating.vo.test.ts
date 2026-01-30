import { describe, it, expect } from 'vitest';
import { Rating } from '../rating.vo';

describe('Rating Value Object', () => {
  describe('create', () => {
    it('should create a rating with value 1', () => {
      const result = Rating.create(1);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(1);
    });

    it('should create a rating with value 3', () => {
      const result = Rating.create(3);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(3);
    });

    it('should create a rating with value 5', () => {
      const result = Rating.create(5);

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe(5);
    });

    it('should fail when rating is 0', () => {
      const result = Rating.create(0);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('entre 1 et 5');
    });

    it('should fail when rating is 6', () => {
      const result = Rating.create(6);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('entre 1 et 5');
    });

    it('should fail when rating is negative', () => {
      const result = Rating.create(-1);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('entre 1 et 5');
    });

    it('should fail when rating is a decimal', () => {
      const result = Rating.create(3.5);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('entier');
    });
  });

  describe('star representation', () => {
    it('should be 1 star for rating 1', () => {
      const rating = Rating.create(1).value;

      expect(rating.isOneStar).toBe(true);
      expect(rating.isTwoStars).toBe(false);
      expect(rating.isThreeStars).toBe(false);
      expect(rating.isFourStars).toBe(false);
      expect(rating.isFiveStars).toBe(false);
    });

    it('should be 5 stars for rating 5', () => {
      const rating = Rating.create(5).value;

      expect(rating.isOneStar).toBe(false);
      expect(rating.isFiveStars).toBe(true);
    });
  });

  describe('quality indicators', () => {
    it('should be positive for ratings >= 4', () => {
      const rating4 = Rating.create(4).value;
      const rating5 = Rating.create(5).value;

      expect(rating4.isPositive).toBe(true);
      expect(rating5.isPositive).toBe(true);
    });

    it('should not be positive for ratings < 4', () => {
      const rating1 = Rating.create(1).value;
      const rating3 = Rating.create(3).value;

      expect(rating1.isPositive).toBe(false);
      expect(rating3.isPositive).toBe(false);
    });

    it('should be negative for ratings <= 2', () => {
      const rating1 = Rating.create(1).value;
      const rating2 = Rating.create(2).value;

      expect(rating1.isNegative).toBe(true);
      expect(rating2.isNegative).toBe(true);
    });

    it('should not be negative for ratings > 2', () => {
      const rating3 = Rating.create(3).value;
      const rating5 = Rating.create(5).value;

      expect(rating3.isNegative).toBe(false);
      expect(rating5.isNegative).toBe(false);
    });

    it('should be neutral for rating 3', () => {
      const rating = Rating.create(3).value;

      expect(rating.isNeutral).toBe(true);
      expect(rating.isPositive).toBe(false);
      expect(rating.isNegative).toBe(false);
    });
  });

  describe('equality', () => {
    it('should be equal for same ratings', () => {
      const rating1 = Rating.create(4).value;
      const rating2 = Rating.create(4).value;

      expect(rating1.equals(rating2)).toBe(true);
    });

    it('should not be equal for different ratings', () => {
      const rating1 = Rating.create(3).value;
      const rating2 = Rating.create(5).value;

      expect(rating1.equals(rating2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return star representation', () => {
      const rating = Rating.create(4).value;

      expect(rating.toString()).toBe('4/5');
    });
  });
});
