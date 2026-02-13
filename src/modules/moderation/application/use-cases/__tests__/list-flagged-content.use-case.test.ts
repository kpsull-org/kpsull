import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListFlaggedContentUseCase } from '../list-flagged-content.use-case';
import type { IModerationRepository, ListFlaggedContentResult } from '../../ports/moderation.repository.interface';
import { FlaggedContent } from '../../../domain/entities/flagged-content.entity';

describe('ListFlaggedContentUseCase', () => {
  let useCase: ListFlaggedContentUseCase;
  let mockRepo: IModerationRepository;

  const createFlaggedContent = (id: string, status: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'DELETED' = 'PENDING') =>
    new FlaggedContent({
      id,
      contentId: `prod-${id}`,
      contentType: 'PRODUCT',
      contentTitle: `Product ${id}`,
      creatorId: 'creator-1',
      creatorName: 'Creator',
      creatorEmail: 'creator@test.com',
      flaggedBy: 'user-1',
      flagReason: 'COUNTERFEIT',
      status,
      flaggedAt: new Date(),
    });

  beforeEach(() => {
    mockRepo = {
      listFlaggedContent: vi.fn(),
      getFlaggedContentById: vi.fn(),
      moderateContent: vi.fn(),
      listModerationActions: vi.fn(),
    };
    useCase = new ListFlaggedContentUseCase(mockRepo);
  });

  it('should list flagged content with defaults', async () => {
    const mockResult: ListFlaggedContentResult = {
      items: [createFlaggedContent('fc-1'), createFlaggedContent('fc-2')],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(mockRepo.listFlaggedContent).mockResolvedValue(mockResult);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.items).toHaveLength(2);
    expect(result.value.total).toBe(2);
  });

  it('should pass status filter to repository', async () => {
    const mockResult: ListFlaggedContentResult = {
      items: [createFlaggedContent('fc-1', 'PENDING')],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(mockRepo.listFlaggedContent).mockResolvedValue(mockResult);

    await useCase.execute({ status: 'PENDING' });

    expect(mockRepo.listFlaggedContent).toHaveBeenCalledWith({ status: 'PENDING' });
  });

  it('should pass pagination params to repository', async () => {
    const mockResult: ListFlaggedContentResult = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
      totalPages: 0,
    };
    vi.mocked(mockRepo.listFlaggedContent).mockResolvedValue(mockResult);

    await useCase.execute({ page: 2, pageSize: 10 });

    expect(mockRepo.listFlaggedContent).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });

  it('should return empty list when no flagged content', async () => {
    const mockResult: ListFlaggedContentResult = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    vi.mocked(mockRepo.listFlaggedContent).mockResolvedValue(mockResult);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.items).toHaveLength(0);
    expect(result.value.total).toBe(0);
  });

  it('should return pagination metadata', async () => {
    const mockResult: ListFlaggedContentResult = {
      items: [createFlaggedContent('fc-1')],
      total: 50,
      page: 3,
      pageSize: 10,
      totalPages: 5,
    };
    vi.mocked(mockRepo.listFlaggedContent).mockResolvedValue(mockResult);

    const result = await useCase.execute({ page: 3, pageSize: 10 });

    expect(result.value.page).toBe(3);
    expect(result.value.pageSize).toBe(10);
    expect(result.value.totalPages).toBe(5);
  });
});
