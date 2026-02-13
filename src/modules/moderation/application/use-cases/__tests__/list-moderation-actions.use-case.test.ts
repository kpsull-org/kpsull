import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListModerationActionsUseCase } from '../list-moderation-actions.use-case';
import type { IModerationRepository, ListModerationActionsResult } from '../../ports/moderation.repository.interface';
import { ModerationAction } from '../../../domain/entities/moderation-action.entity';

describe('ListModerationActionsUseCase', () => {
  let useCase: ListModerationActionsUseCase;
  let mockRepo: IModerationRepository;

  const createModerationAction = (id: string) =>
    new ModerationAction({
      id,
      flaggedContentId: 'fc-1',
      contentTitle: 'Product Test',
      contentType: 'PRODUCT',
      action: 'APPROVE',
      moderatorId: 'admin-1',
      moderatorName: 'Admin',
      moderatorEmail: 'admin@test.com',
      note: 'Looks good',
      createdAt: new Date(),
    });

  beforeEach(() => {
    mockRepo = {
      listFlaggedContent: vi.fn(),
      getFlaggedContentById: vi.fn(),
      moderateContent: vi.fn(),
      listModerationActions: vi.fn(),
    };
    useCase = new ListModerationActionsUseCase(mockRepo);
  });

  it('should list moderation actions with defaults', async () => {
    const mockResult: ListModerationActionsResult = {
      items: [createModerationAction('ma-1'), createModerationAction('ma-2')],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(mockRepo.listModerationActions).mockResolvedValue(mockResult);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.items).toHaveLength(2);
    expect(result.value.total).toBe(2);
  });

  it('should pass pagination params to repository', async () => {
    const mockResult: ListModerationActionsResult = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
      totalPages: 0,
    };
    vi.mocked(mockRepo.listModerationActions).mockResolvedValue(mockResult);

    await useCase.execute({ page: 2, pageSize: 10 });

    expect(mockRepo.listModerationActions).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });

  it('should return empty list when no actions', async () => {
    const mockResult: ListModerationActionsResult = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    vi.mocked(mockRepo.listModerationActions).mockResolvedValue(mockResult);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.items).toHaveLength(0);
    expect(result.value.total).toBe(0);
  });

  it('should return pagination metadata', async () => {
    const mockResult: ListModerationActionsResult = {
      items: [createModerationAction('ma-1')],
      total: 30,
      page: 2,
      pageSize: 15,
      totalPages: 2,
    };
    vi.mocked(mockRepo.listModerationActions).mockResolvedValue(mockResult);

    const result = await useCase.execute({ page: 2, pageSize: 15 });

    expect(result.value.page).toBe(2);
    expect(result.value.pageSize).toBe(15);
    expect(result.value.totalPages).toBe(2);
  });
});
