import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactivateCreatorUseCase } from '../reactivate-creator.use-case';
import type { CreatorRepository } from '../../ports/analytics.repository.interface';

describe('ReactivateCreatorUseCase', () => {
  let useCase: ReactivateCreatorUseCase;
  let mockRepo: CreatorRepository;

  beforeEach(() => {
    mockRepo = {
      listCreators: vi.fn(),
      suspendCreator: vi.fn(),
      reactivateCreator: vi.fn(),
    };
    useCase = new ReactivateCreatorUseCase(mockRepo);
  });

  it('should reactivate a creator successfully', async () => {
    const result = await useCase.execute({
      creatorId: 'creator-1',
      adminId: 'admin-1',
      reason: 'Situation regularisee',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.reactivateCreator).toHaveBeenCalledWith('creator-1', 'admin-1', 'Situation regularisee');
  });

  it('should fail when reason is empty', async () => {
    const result = await useCase.execute({
      creatorId: 'creator-1',
      adminId: 'admin-1',
      reason: '',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('obligatoire');
    expect(mockRepo.reactivateCreator).not.toHaveBeenCalled();
  });
});
