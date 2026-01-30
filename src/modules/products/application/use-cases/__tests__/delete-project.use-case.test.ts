import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteProjectUseCase } from '../projects/delete-project.use-case';
import { ProjectRepository } from '../../ports/project.repository.interface';
import { Project } from '../../../domain/entities/project.entity';

// Mock repository
class MockProjectRepository implements ProjectRepository {
  public deletedId: string | null = null;
  private projects: Map<string, Project> = new Map();

  setProject(project: Project): void {
    this.projects.set(project.idString, project);
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async findByCreatorId(): Promise<Project[]> {
    return [];
  }

  async save(): Promise<void> {}

  async delete(id: string): Promise<void> {
    this.deletedId = id;
    this.projects.delete(id);
  }
}

describe('DeleteProjectUseCase', () => {
  let useCase: DeleteProjectUseCase;
  let mockRepo: MockProjectRepository;

  beforeEach(() => {
    mockRepo = new MockProjectRepository();
    useCase = new DeleteProjectUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should delete project successfully', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setProject(project);

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.deleted).toBe(true);
      expect(result.value!.orphanedProducts).toBe(0);
      expect(mockRepo.deletedId).toBe('project-123');
    });

    it('should return orphaned products count', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        productCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setProject(project);

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.orphanedProducts).toBe(5);
    });

    it('should fail when project not found', async () => {
      // Act
      const result = await useCase.execute({
        projectId: 'non-existent',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvé');
    });

    it('should fail when creator does not own the project', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setProject(project);

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'other-creator',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when projectId is empty', async () => {
      // Act
      const result = await useCase.execute({
        projectId: '',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Project ID');
    });

    it('should fail when creatorId is empty', async () => {
      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });
});
