import { describe, it, expect, beforeEach } from 'vitest';
import { ListProjectsUseCase } from '../projects/list-projects.use-case';
import { ProjectRepository } from '../../ports/project.repository.interface';
import { Project } from '../../../domain/entities/project.entity';

// Mock repository
class MockProjectRepository implements ProjectRepository {
  private projects: Map<string, Project[]> = new Map();

  setProjects(creatorId: string, projects: Project[]): void {
    this.projects.set(creatorId, projects);
  }

  async findById(): Promise<Project | null> {
    return null;
  }

  async findByCreatorId(creatorId: string): Promise<Project[]> {
    return this.projects.get(creatorId) ?? [];
  }

  async save(): Promise<void> {}

  async delete(): Promise<void> {}
}

describe('ListProjectsUseCase', () => {
  let useCase: ListProjectsUseCase;
  let mockRepo: MockProjectRepository;

  beforeEach(() => {
    mockRepo = new MockProjectRepository();
    useCase = new ListProjectsUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should return empty list when no projects', async () => {
      // Act
      const result = await useCase.execute({ creatorId: 'creator-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.projects).toHaveLength(0);
      expect(result.value!.total).toBe(0);
    });

    it('should return all projects for creator', async () => {
      // Arrange
      const projects = [
        Project.reconstitute({
          id: 'project-1',
          creatorId: 'creator-123',
          name: 'Collection Été',
          productCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).value!,
        Project.reconstitute({
          id: 'project-2',
          creatorId: 'creator-123',
          name: 'Collection Hiver',
          productCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).value!,
      ];

      mockRepo.setProjects('creator-123', projects);

      // Act
      const result = await useCase.execute({ creatorId: 'creator-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.projects).toHaveLength(2);
      expect(result.value!.total).toBe(2);
    });

    it('should return project details correctly', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-1',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        description: 'Une belle collection',
        coverImage: 'https://example.com/image.jpg',
        productCount: 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      }).value!;

      mockRepo.setProjects('creator-123', [project]);

      // Act
      const result = await useCase.execute({ creatorId: 'creator-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      const returned = result.value!.projects[0];
      expect(returned?.id).toBe('project-1');
      expect(returned?.name).toBe('Ma Collection');
      expect(returned?.description).toBe('Une belle collection');
      expect(returned?.coverImage).toBe('https://example.com/image.jpg');
      expect(returned?.productCount).toBe(10);
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({ creatorId: '' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should not return projects from other creators', async () => {
      // Arrange
      const projects = [
        Project.reconstitute({
          id: 'project-1',
          creatorId: 'other-creator',
          name: 'Other Collection',
          productCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).value!,
      ];

      mockRepo.setProjects('other-creator', projects);

      // Act
      const result = await useCase.execute({ creatorId: 'creator-123' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.projects).toHaveLength(0);
    });
  });
});
