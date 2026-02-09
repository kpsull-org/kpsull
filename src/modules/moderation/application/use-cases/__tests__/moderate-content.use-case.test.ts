import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModerateContentUseCase } from '../moderate-content.use-case';
import type { IModerationRepository } from '../../ports/moderation.repository.interface';
import { FlaggedContent } from '../../../domain/entities/flagged-content.entity';
import type { FlaggedContentProps } from '../../../domain/entities/flagged-content.entity';

describe('ModerateContentUseCase', () => {
  let useCase: ModerateContentUseCase;
  let mockRepo: IModerationRepository;

  const pendingContentProps: FlaggedContentProps = {
    id: 'fc-1',
    contentId: 'prod-1',
    contentType: 'PRODUCT',
    contentTitle: 'Test Product',
    creatorId: 'creator-1',
    creatorName: 'Creator',
    creatorEmail: 'creator@test.com',
    flaggedBy: 'user-1',
    flagReason: 'COUNTERFEIT',
    status: 'PENDING',
    flaggedAt: new Date(),
  };

  const pendingContent = new FlaggedContent(pendingContentProps);

  beforeEach(() => {
    mockRepo = {
      listFlaggedContent: vi.fn(),
      getFlaggedContentById: vi.fn(),
      moderateContent: vi.fn(),
      listModerationActions: vi.fn(),
    };
    useCase = new ModerateContentUseCase(mockRepo);
  });

  it('should moderate PENDING content successfully', async () => {
    vi.mocked(mockRepo.getFlaggedContentById).mockResolvedValue(pendingContent);
    vi.mocked(mockRepo.moderateContent).mockResolvedValue(
      new FlaggedContent({ ...pendingContentProps, status: 'APPROVED' }),
    );

    const result = await useCase.execute({
      flaggedContentId: 'fc-1',
      action: 'APPROVE',
      moderatorId: 'admin-1',
      moderatorName: 'Admin',
      moderatorEmail: 'admin@test.com',
      note: 'Content is acceptable',
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.moderateContent).toHaveBeenCalledWith({
      flaggedContentId: 'fc-1',
      action: 'APPROVE',
      moderatorId: 'admin-1',
      moderatorName: 'Admin',
      moderatorEmail: 'admin@test.com',
      note: 'Content is acceptable',
    });
  });

  it('should fail for invalid action', async () => {
    const result = await useCase.execute({
      flaggedContentId: 'fc-1',
      action: 'INVALID',
      moderatorId: 'admin-1',
      moderatorName: 'Admin',
      moderatorEmail: 'admin@test.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('Action invalide');
  });

  it('should fail when content not found', async () => {
    vi.mocked(mockRepo.getFlaggedContentById).mockResolvedValue(null);

    const result = await useCase.execute({
      flaggedContentId: 'non-existent',
      action: 'APPROVE',
      moderatorId: 'admin-1',
      moderatorName: 'Admin',
      moderatorEmail: 'admin@test.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('introuvable');
  });

  it('should fail when content is already moderated', async () => {
    vi.mocked(mockRepo.getFlaggedContentById).mockResolvedValue(
      new FlaggedContent({ ...pendingContentProps, status: 'APPROVED' }),
    );

    const result = await useCase.execute({
      flaggedContentId: 'fc-1',
      action: 'DELETE',
      moderatorId: 'admin-1',
      moderatorName: 'Admin',
      moderatorEmail: 'admin@test.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('deja ete modere');
  });

  it('should fail when moderator tries to moderate own content', async () => {
    vi.mocked(mockRepo.getFlaggedContentById).mockResolvedValue(pendingContent);

    const result = await useCase.execute({
      flaggedContentId: 'fc-1',
      action: 'APPROVE',
      moderatorId: 'creator-1', // same as content creator
      moderatorName: 'Creator',
      moderatorEmail: 'creator@test.com',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('propre contenu');
  });
});
