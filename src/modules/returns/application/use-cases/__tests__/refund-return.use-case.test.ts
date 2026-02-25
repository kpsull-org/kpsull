import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

vi.mock('@/modules/products/application/services/stock.service', () => ({
  incrementStock: vi.fn().mockResolvedValue(undefined),
  decrementStock: vi.fn().mockResolvedValue(undefined),
}));

import { RefundReturnUseCase } from '../refund-return.use-case';
import type { ReturnRepository } from '../../ports/return.repository.interface';
import { createReceivedReturn } from './return.fixtures';

type MockReturnRepository = {
  [K in keyof ReturnRepository]: Mock;
};

describe('RefundReturnUseCase', () => {
  let useCase: RefundReturnUseCase;
  let mockRepository: MockReturnRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findByCreatorId: vi.fn(),
      findByCustomerId: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new RefundReturnUseCase(mockRepository as unknown as ReturnRepository);
  });

  it('should mark a received return as refunded', async () => {
    mockRepository.findById.mockResolvedValue(createReceivedReturn());

    const result = await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('REFUNDED');
    expect(result.value.refundedAt).toBeInstanceOf(Date);
  });

  it('should persist the refunded return', async () => {
    mockRepository.findById.mockResolvedValue(createReceivedReturn());

    await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'return-1', status: 'REFUNDED' })
    );
  });

  it('should fail if return not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ returnId: 'non-existent', creatorId: 'creator-123' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('non trouvee');
  });

  it('should fail if not the creator owner', async () => {
    mockRepository.findById.mockResolvedValue(createReceivedReturn());

    const result = await useCase.execute({ returnId: 'return-1', creatorId: 'different-creator' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('autorise');
  });

  it('should fail if return is not in RECEIVED status', async () => {
    mockRepository.findById.mockResolvedValue({ ...createReceivedReturn(), status: 'SHIPPED_BACK' as const });

    const result = await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('recus');
  });

  it('should fail without returnId', async () => {
    const result = await useCase.execute({ returnId: '', creatorId: 'creator-123' });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without creatorId', async () => {
    const result = await useCase.execute({ returnId: 'return-1', creatorId: '' });
    expect(result.isFailure).toBe(true);
  });

  it('should call incrementStock when returnItems are present', async () => {
    const { incrementStock } = await import('@/modules/products/application/services/stock.service');
    const returnWithItems = {
      ...createReceivedReturn(),
      returnItems: [
        { productId: 'prod-1', variantId: 'variant-1', quantity: 2, productName: 'T-Shirt', price: 2500 },
      ],
    };
    mockRepository.findById.mockResolvedValue(returnWithItems);

    const result = await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(result.isSuccess).toBe(true);
    expect(incrementStock).toHaveBeenCalledWith([{ variantId: 'variant-1', quantity: 2 }]);
  });
});
