import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteProjectUseCase } from '../projects/delete-project.use-case';
import { Project } from '../../../domain/entities/project.entity';
import { TestProjectRepository } from '../../../__tests__/helpers/test-project.repository';

describe('DeleteProjectUseCase', () => {
  let useCase: DeleteProjectUseCase;
  let mockRepo: TestProjectRepository;

  beforeEach(() => {
    mockRepo = new TestProjectRepository();
    useCase = new DeleteProjectUseCase(mockRepo);
  });

  function createProject(overrides: Partial<{ id: string; creatorId: string; productCount: number }> = {}): Project {
    return Project.reconstitute({
      id: overrides.id ?? 'project-123',
      creatorId: overrides.creatorId ?? 'creator-123',
      name: 'Ma Collection',
      productCount: overrides.productCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).value;
  }

  describe('execute', () => {
    it('should delete project successfully', async () => {
      mockRepo.set(createProject());

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.deleted).toBe(true);
      expect(result.value.orphanedProducts).toBe(0);
      expect(mockRepo.deletedId).toBe('project-123');
    });

    it('should return orphaned products count', async () => {
      mockRepo.set(createProject({ productCount: 5 }));

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.orphanedProducts).toBe(5);
    });

    it('should fail when project not found', async () => {
      const result = await useCase.execute({
        projectId: 'non-existent',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when creator does not own the project', async () => {
      mockRepo.set(createProject());

      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'other-creator',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when projectId is empty', async () => {
      const result = await useCase.execute({
        projectId: '',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Project ID');
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });
});
