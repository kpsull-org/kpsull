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

  const defaultInput = {
    returnId: 'return-1',
    customerId: 'customer-1',
    trackingNumber: 'TRACK-123',
    carrier: 'Colissimo',
  };

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

    const result = await useCase.execute(defaultInput);

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('SHIPPED_BACK');
    expect(result.value.trackingNumber).toBe('TRACK-123');
    expect(result.value.carrier).toBe('Colissimo');
    expect(result.value.shippedAt).toBeInstanceOf(Date);
  });

  it('should persist the shipped return', async () => {
    mockRepository.findById.mockResolvedValue(createApprovedReturn());

    await useCase.execute(defaultInput);

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'return-1', status: 'SHIPPED_BACK' })
    );
  });

  it('should fail if return not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute({ ...defaultInput, returnId: 'non-existent' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('non trouvee');
  });

  it('should fail if not the customer owner', async () => {
    mockRepository.findById.mockResolvedValue(createApprovedReturn());

    const result = await useCase.execute({ ...defaultInput, customerId: 'different-customer' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('autorise');
  });

  it('should fail if return is not in APPROVED status', async () => {
    mockRepository.findById.mockResolvedValue({ ...createApprovedReturn(), status: 'REQUESTED' as const });

    const result = await useCase.execute(defaultInput);

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('approuves');
  });

  describe('missing required fields', () => {
    it.each([
      { field: 'returnId', input: { ...defaultInput, returnId: '' } },
      { field: 'trackingNumber', input: { ...defaultInput, trackingNumber: '' } },
      { field: 'carrier', input: { ...defaultInput, carrier: '' } },
    ])('should fail without $field', async ({ input }) => {
      const result = await useCase.execute(input);
      expect(result.isFailure).toBe(true);
    });

    it('should fail without customerId', async () => {
      const result = await useCase.execute({ ...defaultInput, customerId: '' });
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Customer ID');
    });
  });
});
