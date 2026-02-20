import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DeleteProjectUseCase } from '../projects/delete-project.use-case';
import type { ImageUploadService } from '../../ports/image-upload.service.interface';
import { Result } from '@/shared/domain';
import { Project } from '../../../domain/entities/project.entity';
import { TestProjectRepository } from '../../../__tests__/helpers/test-project.repository';

function createProject(overrides: Partial<{ id: string; creatorId: string; productCount: number; coverImage?: string }> = {}): Project {
  return Project.reconstitute({
    id: overrides.id ?? 'project-123',
    creatorId: overrides.creatorId ?? 'creator-123',
    name: 'Ma Collection',
    productCount: overrides.productCount ?? 0,
    coverImage: overrides.coverImage,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).value;
}

describe('DeleteProjectUseCase', () => {
  let useCase: DeleteProjectUseCase;
  let mockRepo: TestProjectRepository;
  let mockImageUploadService: {
    upload: Mock;
    delete: Mock;
  };

  beforeEach(() => {
    mockRepo = new TestProjectRepository();

    mockImageUploadService = {
      upload: vi.fn(),
      delete: vi.fn().mockResolvedValue(Result.ok()),
    };

    useCase = new DeleteProjectUseCase(
      mockRepo,
      mockImageUploadService as unknown as ImageUploadService
    );
  });

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

    it('should delete cover image from Cloudinary before deleting project', async () => {
      // Arrange
      const coverImageUrl = 'https://res.cloudinary.com/demo/image/upload/v1/kpsull/collections/cover.jpg';
      mockRepo.set(createProject({ coverImage: coverImageUrl }));

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).toHaveBeenCalledOnce();
      expect(mockImageUploadService.delete).toHaveBeenCalledWith(coverImageUrl);
      expect(mockRepo.deletedId).toBe('project-123');
    });

    it('should still delete project if Cloudinary deletion fails', async () => {
      // Arrange
      const coverImageUrl = 'https://res.cloudinary.com/demo/image/upload/v1/kpsull/collections/cover.jpg';
      mockRepo.set(createProject({ coverImage: coverImageUrl }));
      mockImageUploadService.delete.mockResolvedValue(Result.fail('Cloudinary error'));

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      // Assert - deletion should succeed despite Cloudinary failure
      expect(result.isSuccess).toBe(true);
      expect(result.value.deleted).toBe(true);
      expect(mockRepo.deletedId).toBe('project-123');
    });

    it('should not call Cloudinary if project has no cover image', async () => {
      // Arrange - project without coverImage
      mockRepo.set(createProject({ coverImage: undefined }));

      // Act
      const result = await useCase.execute({
        projectId: 'project-123',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockImageUploadService.delete).not.toHaveBeenCalled();
    });
  });
});
