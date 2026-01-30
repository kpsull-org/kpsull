import { describe, it, expect, beforeEach } from 'vitest';
import {
  CalculateEscrowReleaseUseCase,
  ESCROW_RELEASE_DELAY_HOURS,
  ESCROW_RELEASE_DELAY_MS,
} from '../calculate-escrow-release.use-case';

describe('CalculateEscrowRelease Use Case', () => {
  let useCase: CalculateEscrowReleaseUseCase;

  beforeEach(() => {
    useCase = new CalculateEscrowReleaseUseCase();
  });

  describe('execute', () => {
    it('should return NOT_DELIVERED when deliveredAt is null', async () => {
      const result = await useCase.execute({
        deliveredAt: null,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('NOT_DELIVERED');
      expect(result.value?.releaseDate).toBeNull();
      expect(result.value?.remainingHours).toBeNull();
      expect(result.value?.isReleased).toBe(false);
    });

    it('should return PENDING_RELEASE when within 48h of delivery', async () => {
      const deliveredAt = new Date('2024-01-15T10:00:00Z');
      const currentDate = new Date('2024-01-15T20:00:00Z'); // 10 hours after delivery

      const result = await useCase.execute({
        deliveredAt,
        currentDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('PENDING_RELEASE');
      expect(result.value?.isReleased).toBe(false);
      expect(result.value?.remainingHours).toBe(38); // 48 - 10 = 38 hours remaining
    });

    it('should return RELEASED when 48h have passed since delivery', async () => {
      const deliveredAt = new Date('2024-01-15T10:00:00Z');
      const currentDate = new Date('2024-01-17T12:00:00Z'); // 50 hours after delivery

      const result = await useCase.execute({
        deliveredAt,
        currentDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('RELEASED');
      expect(result.value?.isReleased).toBe(true);
      expect(result.value?.remainingHours).toBe(0);
    });

    it('should return RELEASED when exactly 48h have passed', async () => {
      const deliveredAt = new Date('2024-01-15T10:00:00Z');
      const currentDate = new Date('2024-01-17T10:00:00Z'); // Exactly 48 hours after

      const result = await useCase.execute({
        deliveredAt,
        currentDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('RELEASED');
      expect(result.value?.isReleased).toBe(true);
    });

    it('should calculate correct release date (deliveredAt + 48h)', async () => {
      const deliveredAt = new Date('2024-01-15T10:00:00Z');
      const expectedReleaseDate = new Date('2024-01-17T10:00:00Z');
      const currentDate = new Date('2024-01-15T15:00:00Z');

      const result = await useCase.execute({
        deliveredAt,
        currentDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.releaseDate?.toISOString()).toBe(
        expectedReleaseDate.toISOString()
      );
    });

    it('should ceil remaining hours (partial hours count as full hour)', async () => {
      const deliveredAt = new Date('2024-01-15T10:00:00Z');
      const currentDate = new Date('2024-01-15T10:30:00Z'); // 30 minutes after delivery

      const result = await useCase.execute({
        deliveredAt,
        currentDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.remainingHours).toBe(48); // Ceiled from 47.5
    });

    it('should handle 1 hour remaining correctly', async () => {
      const deliveredAt = new Date('2024-01-15T10:00:00Z');
      const currentDate = new Date('2024-01-17T09:30:00Z'); // 47.5 hours after

      const result = await useCase.execute({
        deliveredAt,
        currentDate,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('PENDING_RELEASE');
      expect(result.value?.remainingHours).toBe(1); // 30 minutes remaining, ceiled to 1
    });

    it('should use current date when not provided', async () => {
      const deliveredAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const result = await useCase.execute({
        deliveredAt,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.status).toBe('PENDING_RELEASE');
      // Should have approximately 24 hours remaining
      expect(result.value?.remainingHours).toBeGreaterThanOrEqual(23);
      expect(result.value?.remainingHours).toBeLessThanOrEqual(25);
    });
  });

  describe('constants', () => {
    it('should have correct escrow delay in hours', () => {
      expect(ESCROW_RELEASE_DELAY_HOURS).toBe(48);
    });

    it('should have correct escrow delay in milliseconds', () => {
      const expectedMs = 48 * 60 * 60 * 1000;
      expect(ESCROW_RELEASE_DELAY_MS).toBe(expectedMs);
    });
  });
});
