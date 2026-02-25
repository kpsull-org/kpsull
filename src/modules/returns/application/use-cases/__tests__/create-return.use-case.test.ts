import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateReturnUseCase } from '../create-return.use-case';
import type { ReturnRepository, ReturnRequest } from '../../ports/return.repository.interface';
import { createMockReturnRepository, type MockReturnRepository } from './return.fixtures';

describe('CreateReturnUseCase', () => {
  let useCase: CreateReturnUseCase;
  let mockRepository: MockReturnRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockReturnRepository();
    useCase = new CreateReturnUseCase(mockRepository as unknown as ReturnRepository);
  });

  const createValidInput = () => ({
    orderId: 'order-1',
    orderNumber: 'KPS-2024-001',
    customerId: 'customer-1',
    customerName: 'Jean Dupont',
    customerEmail: 'jean@example.com',
    creatorId: 'creator-123',
    reason: 'DEFECTIVE' as const,
    reasonDetails: 'Produit defectueux',
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  it('should create a return request successfully', async () => {
    mockRepository.findByOrderId.mockResolvedValue(null);

    const result = await useCase.execute(createValidInput());

    expect(result.isSuccess).toBe(true);
    expect(result.value.orderId).toBe('order-1');
    expect(result.value.status).toBe('REQUESTED');
    expect(result.value.id).toMatch(/^ret_/);
  });

  it('should persist the return via repository', async () => {
    mockRepository.findByOrderId.mockResolvedValue(null);

    await useCase.execute(createValidInput());

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        status: 'REQUESTED',
        customerId: 'customer-1',
        creatorId: 'creator-123',
      })
    );
  });

  it('should fail if a non-rejected return already exists', async () => {
    const existing: ReturnRequest = {
      id: 'ret-existing',
      orderId: 'order-1',
      orderNumber: 'KPS-2024-001',
      creatorId: 'creator-123',
      customerId: 'customer-1',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      reason: 'DEFECTIVE',
      status: 'REQUESTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepository.findByOrderId.mockResolvedValue(existing);

    const result = await useCase.execute(createValidInput());

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('existe deja');
  });

  it('should allow creating when previous return was rejected', async () => {
    const rejected: ReturnRequest = {
      id: 'ret-old',
      orderId: 'order-1',
      orderNumber: 'KPS-2024-001',
      creatorId: 'creator-123',
      customerId: 'customer-1',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      reason: 'DEFECTIVE',
      status: 'REJECTED',
      rejectionReason: 'Not valid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRepository.findByOrderId.mockResolvedValue(rejected);

    const result = await useCase.execute(createValidInput());

    expect(result.isSuccess).toBe(true);
  });

  it('should fail if return window of 14 days is exceeded', async () => {
    mockRepository.findByOrderId.mockResolvedValue(null);
    const input = {
      ...createValidInput(),
      deliveredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    };

    const result = await useCase.execute(input);

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('depasse');
  });

  it('should fail without orderId', async () => {
    const result = await useCase.execute({ ...createValidInput(), orderId: '' });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without customerId', async () => {
    const result = await useCase.execute({ ...createValidInput(), customerId: '' });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without creatorId', async () => {
    const result = await useCase.execute({ ...createValidInput(), creatorId: '' });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without reason', async () => {
    const result = await useCase.execute({
      ...createValidInput(),
      reason: undefined as unknown as ReturnType<typeof createValidInput>['reason'],
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('raison');
  });

  it('should fail without deliveredAt', async () => {
    const result = await useCase.execute({
      ...createValidInput(),
      deliveredAt: undefined as unknown as Date,
    });
    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('livraison');
  });
});
