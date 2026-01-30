import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { GetSalesAnalyticsUseCase } from '../get-sales-analytics.use-case';
import type { AnalyticsRepository, SalesAnalytics } from '../../ports';
import { TimePeriod } from '../../../domain/value-objects';

type MockAnalyticsRepository = {
  [K in keyof AnalyticsRepository]: Mock;
};

describe('GetSalesAnalyticsUseCase', () => {
  let useCase: GetSalesAnalyticsUseCase;
  let mockRepository: MockAnalyticsRepository;

  const createMockSalesAnalytics = (
    overrides: Partial<SalesAnalytics> = {}
  ): SalesAnalytics => ({
    topSellingProducts: [
      {
        productId: 'product-1',
        productName: 'Produit Premium',
        totalSold: 150,
        totalRevenue: 450000,
      },
      {
        productId: 'product-2',
        productName: 'Produit Standard',
        totalSold: 100,
        totalRevenue: 200000,
      },
      {
        productId: 'product-3',
        productName: 'Produit Basic',
        totalSold: 75,
        totalRevenue: 75000,
      },
    ],
    salesByStatus: [
      { status: 'DELIVERED', count: 200, revenue: 600000 },
      { status: 'SHIPPED', count: 50, revenue: 150000 },
      { status: 'PENDING', count: 25, revenue: 75000 },
      { status: 'CANCELLED', count: 10, revenue: 0 },
    ],
    currentPeriodRevenue: 825000,
    previousPeriodRevenue: 700000,
    revenueChange: 125000,
    revenueChangePercent: 17.86,
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      getDashboardStats: vi.fn(),
      getSalesAnalytics: vi.fn(),
    };
    useCase = new GetSalesAnalyticsUseCase(
      mockRepository as unknown as AnalyticsRepository
    );
  });

  describe('execute', () => {
    it('should return sales analytics for a creator', async () => {
      // Arrange
      const mockAnalytics = createMockSalesAnalytics();
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.topSellingProducts).toHaveLength(3);
      expect(result.value?.salesByStatus).toHaveLength(4);
      expect(result.value?.currentPeriodRevenue).toBe(825000);
      expect(result.value?.previousPeriodRevenue).toBe(700000);
      expect(result.value?.revenueChange).toBe(125000);
      expect(result.value?.revenueChangePercent).toBe(17.86);
    });

    it('should return top 10 selling products', async () => {
      // Arrange
      const topProducts = Array.from({ length: 15 }, (_, i) => ({
        productId: `product-${i + 1}`,
        productName: `Produit ${i + 1}`,
        totalSold: 100 - i * 5,
        totalRevenue: (100 - i * 5) * 3000,
      }));

      const mockAnalytics = createMockSalesAnalytics({
        topSellingProducts: topProducts.slice(0, 10),
      });
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.topSellingProducts).toHaveLength(10);
      expect(result.value?.topSellingProducts[0]?.productId).toBe('product-1');
      expect(result.value?.topSellingProducts[9]?.productId).toBe('product-10');
    });

    it('should call repository with correct period', async () => {
      // Arrange
      const mockAnalytics = createMockSalesAnalytics();
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_7_DAYS',
      });

      // Assert
      expect(mockRepository.getSalesAnalytics).toHaveBeenCalledWith(
        'creator-123',
        expect.any(TimePeriod)
      );
      const calledPeriod = mockRepository.getSalesAnalytics.mock
        .calls[0]?.[1] as TimePeriod;
      expect(calledPeriod.value).toBe('LAST_7_DAYS');
    });

    it('should use LAST_30_DAYS as default period when not specified', async () => {
      // Arrange
      const mockAnalytics = createMockSalesAnalytics();
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      await useCase.execute({
        creatorId: 'creator-123',
      });

      // Assert
      const calledPeriod = mockRepository.getSalesAnalytics.mock
        .calls[0]?.[1] as TimePeriod;
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
      mockRepository.getSalesAnalytics.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('analytics');
    });

    it('should return negative revenue change when revenue decreased', async () => {
      // Arrange
      const mockAnalytics = createMockSalesAnalytics({
        currentPeriodRevenue: 500000,
        previousPeriodRevenue: 700000,
        revenueChange: -200000,
        revenueChangePercent: -28.57,
      });
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.revenueChange).toBe(-200000);
      expect(result.value?.revenueChangePercent).toBe(-28.57);
    });

    it('should return zero values when no sales data', async () => {
      // Arrange
      const emptyAnalytics = createMockSalesAnalytics({
        topSellingProducts: [],
        salesByStatus: [],
        currentPeriodRevenue: 0,
        previousPeriodRevenue: 0,
        revenueChange: 0,
        revenueChangePercent: 0,
      });
      mockRepository.getSalesAnalytics.mockResolvedValue(emptyAnalytics);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value?.topSellingProducts).toHaveLength(0);
      expect(result.value?.salesByStatus).toHaveLength(0);
      expect(result.value?.currentPeriodRevenue).toBe(0);
    });

    it('should include all order statuses in salesByStatus', async () => {
      // Arrange
      const mockAnalytics = createMockSalesAnalytics();
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      const result = await useCase.execute({
        creatorId: 'creator-123',
        period: 'LAST_30_DAYS',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      const statuses = result.value?.salesByStatus.map((s) => s.status);
      expect(statuses).toContain('DELIVERED');
      expect(statuses).toContain('SHIPPED');
      expect(statuses).toContain('PENDING');
      expect(statuses).toContain('CANCELLED');
    });

    it('should accept all valid period types', async () => {
      // Arrange
      const mockAnalytics = createMockSalesAnalytics();
      mockRepository.getSalesAnalytics.mockResolvedValue(mockAnalytics);

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
