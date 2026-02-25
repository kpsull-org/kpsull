import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListCreatorsUseCase } from '../list-creators.use-case';
import type { CreatorRepository, CreatorSummary } from '../../ports/analytics.repository.interface';

/**
 * Bug regression: digest 3975031236
 * Server Component render crash on /admin/creators
 *
 * Root cause: CreatorSummary.registeredAt is a Date object.
 * Next.js cannot serialize Date objects when passing props from a Server Component
 * to a Client Component. This causes a full page crash instead of a graceful error.
 *
 * Fix: serialize registeredAt to ISO string before passing to the Client Component.
 * The repository must return Date objects (domain model), but the page must map
 * them to strings before handing off to any 'use client' component.
 */
describe('ListCreatorsUseCase', () => {
  let useCase: ListCreatorsUseCase;
  let mockRepo: CreatorRepository;

  const mockCreators: CreatorSummary[] = [
    {
      id: 'creator-1',
      name: 'Alice Dupont',
      email: 'alice@example.com',
      registeredAt: new Date('2024-01-15T10:00:00.000Z'),
      status: 'ACTIVE',
      totalRevenue: 12500,
    },
    {
      id: 'creator-2',
      name: 'Bob Martin',
      email: 'bob@example.com',
      registeredAt: new Date('2024-03-20T08:30:00.000Z'),
      status: 'SUSPENDED',
      totalRevenue: 4200,
    },
  ];

  beforeEach(() => {
    mockRepo = {
      listCreators: vi.fn().mockResolvedValue({
        creators: mockCreators,
        total: mockCreators.length,
      }),
      suspendCreator: vi.fn(),
      reactivateCreator: vi.fn(),
    };
    useCase = new ListCreatorsUseCase(mockRepo);
  });

  it('should return creators successfully', async () => {
    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.isSuccess).toBe(true);
    expect(result.value.creators).toHaveLength(2);
    expect(result.value.total).toBe(2);
  });

  it('should compute totalPages correctly', async () => {
    vi.mocked(mockRepo.listCreators).mockResolvedValue({
      creators: mockCreators,
      total: 25,
    });

    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.isSuccess).toBe(true);
    expect(result.value.totalPages).toBe(3);
    expect(result.value.page).toBe(1);
    expect(result.value.pageSize).toBe(10);
  });

  /**
   * Regression: Bug digest 3975031236
   * The use case must return Date objects for registeredAt (correct domain model).
   * The serialization to ISO string is the responsibility of the page.tsx server component.
   * This test verifies the Date is preserved by the use case so the page can serialize it.
   */
  it('should return registeredAt as Date objects (serializable by page.tsx)', async () => {
    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.isSuccess).toBe(true);

    const creator = result.value.creators[0];
    if (!creator) throw new Error('No creator returned');
    expect(creator.registeredAt).toBeInstanceOf(Date);

    // Verify that toISOString() works — this is what page.tsx calls to serialize
    // before passing to the Client Component, preventing the digest 3975031236 crash.
    expect(() => creator.registeredAt.toISOString()).not.toThrow();
    expect(creator.registeredAt.toISOString()).toBe('2024-01-15T10:00:00.000Z');
  });

  it('should apply default pagination when not specified', async () => {
    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.listCreators).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        sortBy: 'registeredAt',
        sortDirection: 'desc',
      })
    );
  });

  it('should clamp page to minimum 1', async () => {
    const result = await useCase.execute({ page: -5, pageSize: 10 });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.listCreators).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('should clamp pageSize to maximum 100', async () => {
    const result = await useCase.execute({ page: 1, pageSize: 500 });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.listCreators).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 100 })
    );
  });

  it('should trim search query', async () => {
    await useCase.execute({ search: '  alice  ' });

    expect(mockRepo.listCreators).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'alice' })
    );
  });

  it('should pass undefined for empty search (after trim)', async () => {
    await useCase.execute({ search: '   ' });

    expect(mockRepo.listCreators).toHaveBeenCalledWith(
      expect.objectContaining({ search: undefined })
    );
  });

  it('should return failure when repository throws', async () => {
    vi.mocked(mockRepo.listCreators).mockRejectedValue(
      new Error('P2022: column does not exist')
    );

    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('P2022');
  });

  it('should handle unknown errors gracefully', async () => {
    vi.mocked(mockRepo.listCreators).mockRejectedValue('unexpected string error');

    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Erreur inconnue');
  });
});
