import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateProjectUseCase } from '../projects/update-project.use-case';
import { ProjectRepository } from '../../ports/project.repository.interface';
import { Project } from '../../../domain/entities/project.entity';

// Mock repository
class MockProjectRepository implements ProjectRepository {
  public savedProject: Project | null = null;
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

  async save(project: Project): Promise<void> {
    this.savedProject = project;
    this.projects.set(project.idString, project);
  }

  async delete(): Promise<void> {}
}

describe('UpdateProjectUseCase', () => {
  let useCase: UpdateProjectUseCase;
  let mockRepo: MockProjectRepository;

  beforeEach(() => {
    mockRepo = new MockProjectRepository();
    useCase = new UpdateProjectUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should update project name successfully', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ancien Nom',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setProject(project);

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        name: 'Nouveau Nom',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Nouveau Nom');
      expect(mockRepo.savedProject).not.toBeNull();
    });

    it('should update project description', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        description: 'Ancienne description',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setProject(project);

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        description: 'Nouvelle description',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBe('Nouvelle description');
    });

    it('should update project cover image', async () => {
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
        coverImage: 'https://example.com/new-image.jpg',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.coverImage).toBe('https://example.com/new-image.jpg');
    });

    it('should fail when project not found', async () => {
      // Act
      const result = await useCase.execute({
        projectId: 'non-existent',
        creatorId: 'creator-123',
        name: 'Nouveau Nom',
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
        name: 'Nouveau Nom',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorisé');
    });

    it('should fail when new name is empty', async () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ancien Nom',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      mockRepo.setProject(project);

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
        name: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });
  });
});
