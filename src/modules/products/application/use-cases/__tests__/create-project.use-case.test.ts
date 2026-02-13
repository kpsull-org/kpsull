import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProjectUseCase } from '../projects/create-project.use-case';
import { TestProjectRepository } from '../../../__tests__/helpers/test-project.repository';

describe('CreateProjectUseCase', () => {
  let useCase: CreateProjectUseCase;
  let mockRepo: TestProjectRepository;

  beforeEach(() => {
    mockRepo = new TestProjectRepository();
    useCase = new CreateProjectUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should create a project successfully', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Ma Collection Été',
        description: 'Collection pour l\'été 2024',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe('Ma Collection Été');
      expect(result.value.description).toBe('Collection pour l\'été 2024');
      expect(result.value.creatorId).toBe('creator-123');
      expect(mockRepo.savedProject).not.toBeNull();
    });

    it('should create a project with cover image', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Ma Collection',
        coverImage: 'https://example.com/image.jpg',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.coverImage).toBe('https://example.com/image.jpg');
    });

    it('should fail when name is empty', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when creatorId is empty', async () => {
      const result = await useCase.execute({
        creatorId: '',
        name: 'Ma Collection',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });

    it('should return project with id', async () => {
      const result = await useCase.execute({
        creatorId: 'creator-123',
        name: 'Ma Collection',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBeDefined();
      expect(result.value.id.length).toBeGreaterThan(0);
    });
  });
});
