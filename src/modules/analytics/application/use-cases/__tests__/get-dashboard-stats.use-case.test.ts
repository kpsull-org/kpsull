import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { GetDashboardStatsUseCase } from '../get-dashboard-stats.use-case';
import type { AnalyticsRepository, DashboardStats } from '../../ports';
import { TimePeriod } from '../../../domain/value-objects';

type MockAnalyticsRepository = {
  [K in keyof AnalyticsRepository]: Mock;
};

describe('GetDashboardStatsUseCase', () => {
  let useCase: GetDashboardStatsUseCase;
  let mockRepository: MockAnalyticsRepository;

  const createMockDashboardStats = (overrides: Partial<DashboardStats> = {}): DashboardStats => ({
    totalRevenue: 150000, // 1500.00 EUR in centimes
    totalOrders: 25,
    averageOrderValue: 6000, // 60.00 EUR in centimes
    totalProducts: 50,
    publishedProducts: 35,
    totalReviews: 120,
    averageRating: 4.5,
    newCustomers: 15,
    revenueByDay: [
      { date: '2024-01-01', revenue: 10000 },
      { date: '2024-01-02', revenue: 15000 },
      { date: '2024-01-03', revenue: 12000 },
    ],
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      getDashboardStats: vi.fn(),
      getSalesAnalytics: vi.fn(),
    };
    useCase = new GetDashboardStatsUseCase(mockRepository as unknown as AnalyticsRepository);
  });

  describe('execute', () => {
    it('should return dashboard stats for a creator', async () => {
      // Arrange
      const mockStats = createMockDashboardStats();
      mockRepository.getDashboardStats.mockResolvedValue(mockStats);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.totalRevenue).toBe(150000);
      expect(result.value?.totalOrders).toBe(25);
      expect(result.value?.averageOrderValue).toBe(6000);
      expect(result.value?.totalProducts).toBe(50);
      expect(result.value?.publishedProducts).toBe(35);
      expect(result.value?.totalReviews).toBe(120);
      expect(result.value?.averageRating).toBe(4.5);
      expect(result.value?.newCustomers).toBe(15);
      expect(result.value?.revenueByDay).toHaveLength(3);
    });

    it('should call repository with correct period', async () => {
      // Arrange
      const mockStats = createMockDashboardStats();
      mockRepository.getDashboardStats.mockResolvedValue(mockStats);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_7_DAYS',
      });

      // Assert
      expect(mockRepository.getDashboardStats).toHaveBeenCalledWith(
        'creator-123',
        expect.any(TimePeriod)
      );
      const calledPeriod = mockRepository.getDashboardStats.mock.calls[0]?.[1] as TimePeriod;
      expect(calledPeriod.value).toBe('LAST_7_DAYS');
    });

    it('should use LAST_30_DAYS as default period when not specified', async () => {
      // Arrange
      const mockStats = createMockDashboardStats();
      mockRepository.getDashboardStats.mockResolvedValue(mockStats);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      const calledPeriod = mockRepository.getDashboardStats.mock.calls[0]?.[1] as TimePeriod;
      expect(calledPeriod.value).toBe('LAST_30_DAYS');
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: '',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should fail with invalid period type', async () => {
      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'INVALID_PERIOD' as 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('periode');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.getDashboardStats.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('statistiques');
    });

    it('should return zero values for empty stats', async () => {
      // Arrange
      const emptyStats = createMockDashboardStats({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalProducts: 0,
        publishedProducts: 0,
        totalReviews: 0,
        averageRating: 0,
        newCustomers: 0,
        revenueByDay: [],
      });
      mockRepository.getDashboardStats.mockResolvedValue(emptyStats);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.totalRevenue).toBe(0);
      expect(result.value?.totalOrders).toBe(0);
      expect(result.value?.revenueByDay).toHaveLength(0);
    });

    it('should accept all valid period types', async () => {
      // Arrange
      const mockStats = createMockDashboardStats();
      mockRepository.getDashboardStats.mockResolvedValue(mockStats);

      const periods = [
        'TODAY',
        'LAST_7_DAYS',
        'LAST_30_DAYS',
        'LAST_90_DAYS',
        'THIS_MONTH',
        'LAST_MONTH',
        'THIS_YEAR',
      ] as const;

      // Act & Assert
      for (const period of periods) {
        const result = await useCase.execute({
          creatorId: 'creator-123',
          period,
        });
        expect(result.isSuccess).toBe(true);
      }
    });
  });
});
