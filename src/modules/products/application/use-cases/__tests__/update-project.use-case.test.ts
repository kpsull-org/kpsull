import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateProjectUseCase } from '../projects/update-project.use-case';
import { Project } from '../../../domain/entities/project.entity';
import { TestProjectRepository } from '../../../__tests__/helpers/test-project.repository';

describe('UpdateProjectUseCase', () => {
  let useCase: UpdateProjectUseCase;
  let mockRepo: TestProjectRepository;

  beforeEach(() => {
    mockRepo = new TestProjectRepository();
    useCase = new UpdateProjectUseCase(mockRepo);
  });

  function createProject(overrides: Partial<{ id: string; creatorId: string; name: string; description: string; productCount: number }> = {}): Project {
    return Project.reconstitute({
      id: overrides.id ?? 'project-123',
      creatorId: overrides.creatorId ?? 'creator-123',
      name: overrides.name ?? 'Ma Collection',
      description: overrides.description,
      productCount: overrides.productCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).value;
  }

  describe('execute', () => {
    it('should update project name successfully', async () => {
      mockRepo.set(createProject({ name: 'Ancien Nom' }));

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        name: 'Nouveau Nom',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Nouveau Nom');
      expect(mockRepo.savedProject).not.toBeNull();
    });

    it('should update project description', async () => {
      mockRepo.set(createProject({ description: 'Ancienne description' }));

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        description: 'Nouvelle description',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.description).toBe('Nouvelle description');
    });

    it('should update project cover image', async () => {
      mockRepo.set(createProject());

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        coverImage: 'https://example.com/new-image.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.coverImage).toBe('https://example.com/new-image.jpg');
    });

    it('should fail when project not found', async () => {
      const result = await useCase.execute({
        projectId: 'non-existent',
        creatorId: 'creator-123',
        name: 'Nouveau Nom',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when creator does not own the project', async () => {
      mockRepo.set(createProject());

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'other-creator',
        name: 'Nouveau Nom',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when new name is empty', async () => {
      mockRepo.set(createProject({ name: 'Ancien Nom' }));

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        name: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });
  });
});
