import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProjectUseCase } from '../projects/create-project.use-case';
import { ProjectRepository } from '../../ports/project.repository.interface';
import { Project } from '../../../domain/entities/project.entity';

// Mock repository
class MockProjectRepository implements ProjectRepository {
  public savedProject: Project | null = null;
  private projects: Map<string, Project> = new Map();

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async findByCreatorId(): Promise<Project[]> {
    return [];
  }

  async save(project: Project): Promise<void> {
    this.savedProject = project;
    this.projects.set(project.idString, project);
  }

  async delete(): Promise<void> {}
}

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let mockRepo: MockProjectRepository;

  beforeEach(() => {
    mockRepo = new MockProjectRepository();
    useCase = new CreateProjectUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Ma Collection Été',
        description: 'Collection pour l\'été 2024',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Ma Collection Été');
      expect(result.value!.description).toBe('Collection pour l\'été 2024');
      expect(result.value!.creatorId).toBe('creator-123');
      expect(mockRepo.savedProject).not.toBeNull();
    });

    it('should create a project with cover image', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Ma Collection',
        coverImage: 'https://example.com/image.jpg',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.coverImage).toBe('https://example.com/image.jpg');
    });

    it('should fail when name is empty', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: '',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when creatorId is empty', async () => {
      // Arrange
      const input = {
        creatorId: '',
        name: 'Ma Collection',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should return project with id', async () => {
      // Arrange
      const input = {
        creatorId: 'creator-123',
        name: 'Ma Collection',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.id).toBeDefined();
      expect(result.value!.id.length).toBeGreaterThan(0);
    });
  });
});
