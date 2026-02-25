import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ShipBackReturnUseCase } from '../ship-back-return.use-case';
import type { ReturnRepository } from '../../ports/return.repository.interface';
import { createApprovedReturn } from './return.fixtures';

type MockReturnRepository = {
  [K in keyof ReturnRepository]: Mock;
};

describe('ShipBackReturnUseCase', () => {
  let useCase: ShipBackReturnUseCase;
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
    useCase = new ShipBackReturnUseCase(mockRepository as unknown as ReturnRepository);
  });

  it('should mark an approved return as shipped back', async () => {
    mockRepository.findById.mockResolvedValue(createApprovedReturn());

    const result = await useCase.execute({
      returnId: 'return-1',
      customerId: 'customer-1',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('SHIPPED_BACK');
    expect(result.value.trackingNumber).toBe('TRACK-123');
    expect(result.value.carrier).toBe('Colissimo');
    expect(result.value.shippedAt).toBeInstanceOf(Date);
  });

  it('should persist the shipped return', async () => {
    mockRepository.findById.mockResolvedValue(createApprovedReturn());

    await useCase.execute({
      returnId: 'return-1',
      customerId: 'customer-1',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'return-1', status: 'SHIPPED_BACK' })
    );
  });

  it('should fail if return not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({
      returnId: 'non-existent',
      customerId: 'customer-1',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('non trouvee');
  });

  it('should fail if not the customer owner', async () => {
    mockRepository.findById.mockResolvedValue(createApprovedReturn());

    const result = await useCase.execute({
      returnId: 'return-1',
      customerId: 'different-customer',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('autorise');
  });

  it('should fail if return is not in APPROVED status', async () => {
    mockRepository.findById.mockResolvedValue({ ...createApprovedReturn(), status: 'REQUESTED' as const });

    const result = await useCase.execute({
      returnId: 'return-1',
      customerId: 'customer-1',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('approuves');
  });

  it('should fail without returnId', async () => {
    const result = await useCase.execute({
      returnId: '',
      customerId: 'customer-1',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without customerId', async () => {
    const result = await useCase.execute({
      returnId: 'return-1',
      customerId: '',
      trackingNumber: 'TRACK-123',
      carrier: 'Colissimo',
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Customer ID');
  });

  it('should fail without trackingNumber', async () => {
    const result = await useCase.execute({
      returnId: 'return-1',
      customerId: 'customer-1',
      trackingNumber: '',
      carrier: 'Colissimo',
    });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without carrier', async () => {
    const result = await useCase.execute({
      returnId: 'return-1',
      customerId: 'customer-1',
      trackingNumber: 'TRACK-123',
      carrier: '',
    });
    expect(result.isFailure).toBe(true);
  });
});
