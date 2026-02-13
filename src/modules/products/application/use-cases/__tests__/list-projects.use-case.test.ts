import { describe, it, expect, beforeEach } from 'vitest';
import { ListProjectsUseCase } from '../projects/list-projects.use-case';
import { Project } from '../../../domain/entities/project.entity';
import { TestProjectRepository } from '../../../__tests__/helpers/test-project.repository';

describe('ListProjectsUseCase', () => {
  let useCase: ListProjectsUseCase;
  let mockRepo: TestProjectRepository;

  beforeEach(() => {
    mockRepo = new TestProjectRepository();
    useCase = new ListProjectsUseCase(mockRepo);
  });

  function createProject(overrides: Partial<{ id: string; creatorId: string; name: string; description: string; coverImage: string; productCount: number; createdAt: Date; updatedAt: Date }> = {}): Project {
    return Project.reconstitute({
      id: overrides.id ?? 'project-1',
      creatorId: overrides.creatorId ?? 'creator-123',
      name: overrides.name ?? 'Ma Collection',
      description: overrides.description,
      coverImage: overrides.coverImage,
      productCount: overrides.productCount ?? 0,
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
    }).value;
  }

  describe('execute', () => {
    it('should return empty list when no projects', async () => {
      const result = await useCase.execute({ creatorId: 'creator-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.projects).toHaveLength(0);
      expect(result.value.total).toBe(0);
    });

    it('should return all projects for creator', async () => {
      mockRepo.setForCreator('creator-123', [
        createProject({ id: 'project-1', name: 'Collection Été', productCount: 5 }),
        createProject({ id: 'project-2', name: 'Collection Hiver', productCount: 3 }),
      ]);

      const result = await useCase.execute({ creatorId: 'creator-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.projects).toHaveLength(2);
      expect(result.value.total).toBe(2);
    });

    it('should return project details correctly', async () => {
      mockRepo.setForCreator('creator-123', [
        createProject({
          name: 'Ma Collection',
          description: 'Une belle collection',
          coverImage: 'https://example.com/image.jpg',
          productCount: 10,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        }),
      ]);

      const result = await useCase.execute({ creatorId: 'creator-123' });

      expect(result.isSuccess).toBe(true);
      const returned = result.value.projects[0];
      expect(returned?.id).toBe('project-1');
      expect(returned?.name).toBe('Ma Collection');
      expect(returned?.description).toBe('Une belle collection');
      expect(returned?.coverImage).toBe('https://example.com/image.jpg');
      expect(returned?.productCount).toBe(10);
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({ creatorId: '' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should not return projects from other creators', async () => {
      mockRepo.setForCreator('other-creator', [
        createProject({ creatorId: 'other-creator', name: 'Other Collection', productCount: 5 }),
      ]);

      const result = await useCase.execute({ creatorId: 'creator-123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value.projects).toHaveLength(0);
    });
  });
});
