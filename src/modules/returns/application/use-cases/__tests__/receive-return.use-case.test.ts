import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceiveReturnUseCase } from '../receive-return.use-case';
import type { ReturnRepository } from '../../ports/return.repository.interface';
import {
  createShippedBackReturn,
  createMockReturnRepository,
  assertFailsWhenReturnNotFound,
  assertFailsWhenNotCreatorOwner,
  type MockReturnRepository,
} from './return.fixtures';

describe('ReceiveReturnUseCase', () => {
  let useCase: ReceiveReturnUseCase;
  let mockRepository: MockReturnRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockReturnRepository();
    useCase = new ReceiveReturnUseCase(mockRepository as unknown as ReturnRepository);
  });

  it('should mark a shipped back return as received', async () => {
    mockRepository.findById.mockResolvedValue(createShippedBackReturn());

    const result = await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('RECEIVED');
    expect(result.value.receivedAt).toBeInstanceOf(Date);
  });

  it('should persist the received return', async () => {
    mockRepository.findById.mockResolvedValue(createShippedBackReturn());

    await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'return-1', status: 'RECEIVED' })
    );
  });

  it('should fail if return not found', async () => {
    await assertFailsWhenReturnNotFound(
      (input) => useCase.execute(input),
      mockRepository
    );
  });

  it('should fail if not the creator owner', async () => {
    await assertFailsWhenNotCreatorOwner(
      (input) => useCase.execute(input),
      mockRepository,
      createShippedBackReturn()
    );
  });

  it('should fail if return is not in SHIPPED_BACK status', async () => {
    mockRepository.findById.mockResolvedValue({ ...createShippedBackReturn(), status: 'APPROVED' as const });

    const result = await useCase.execute({ returnId: 'return-1', creatorId: 'creator-123' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('expedies');
  });

  it('should fail without returnId', async () => {
    const result = await useCase.execute({ returnId: '', creatorId: 'creator-123' });
    expect(result.isFailure).toBe(true);
  });

  it('should fail without creatorId', async () => {
    const result = await useCase.execute({ returnId: 'return-1', creatorId: '' });
    expect(result.isFailure).toBe(true);
  });
});
