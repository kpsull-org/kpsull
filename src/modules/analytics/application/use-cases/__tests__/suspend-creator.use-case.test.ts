import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuspendCreatorUseCase } from '../suspend-creator.use-case';
import type { CreatorRepository } from '../../ports/analytics.repository.interface';

describe('SuspendCreatorUseCase', () => {
  let useCase: SuspendCreatorUseCase;
  let mockRepo: CreatorRepository;

  beforeEach(() => {
    mockRepo = {
      listCreators: vi.fn(),
      suspendCreator: vi.fn(),
      reactivateCreator: vi.fn(),
    };
    useCase = new SuspendCreatorUseCase(mockRepo);
  });

  it('should suspend a creator successfully', async () => {
    const result = await useCase.execute({
      creatorId: 'creator-1',
      adminId: 'admin-1',
      reason: 'Violation des CGU',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.suspendCreator).toHaveBeenCalledWith('creator-1', 'admin-1', 'Violation des CGU');
  });

  it('should fail when reason is empty', async () => {
    const result = await useCase.execute({
      creatorId: 'creator-1',
      adminId: 'admin-1',
      reason: '  ',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('obligatoire');
    expect(mockRepo.suspendCreator).not.toHaveBeenCalled();
  });
});
