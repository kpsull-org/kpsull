import { describe, it, expect } from 'vitest';
import { Project } from '../entities/project.entity';

describe('Project Entity', () => {
  describe('create', () => {
    it('should create a valid project with required fields', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        name: 'Ma Collection Été',
      };

      // Act
      const result = Project.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.creatorId).toBe('creator-123');
      expect(result.value!.name).toBe('Ma Collection Été');
      expect(result.value!.productCount).toBe(0);
    });

    it('should create a project with all optional fields', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        name: 'Ma Collection',
        description: 'Description de ma collection',
        coverImage: 'https://example.com/image.jpg',
      };

      // Act
      const result = Project.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.description).toBe('Description de ma collection');
      expect(result.value!.coverImage).toBe('https://example.com/image.jpg');
    });

    it('should fail when name is empty', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        name: '',
      };

      // Act
      const result = Project.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name is only whitespace', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        name: '   ',
      };

      // Act
      const result = Project.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('nom');
    });

    it('should fail when name exceeds 100 characters', () => {
      // Arrange
      const props = {
        creatorId: 'creator-123',
        name: 'a'.repeat(101),
      };

      // Act
      const result = Project.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('100');
    });

    it('should fail when creatorId is empty', () => {
      // Arrange
      const props = {
        creatorId: '',
        name: 'Ma Collection',
      };

      // Act
      const result = Project.create(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a project from persistence', () => {
      // Arrange
      const props = {
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        description: 'Description',
        coverImage: 'https://example.com/image.jpg',
        productCount: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      // Act
      const result = Project.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.idString).toBe('project-123');
      expect(result.value!.productCount).toBe(5);
      expect(result.value!.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.value!.updatedAt).toEqual(new Date('2024-01-15'));
    });
  });

  describe('updateName', () => {
    it('should update the name successfully', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ancien Nom',
      }).value!;

      // Act
      const result = project.updateName('Nouveau Nom');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(project.name).toBe('Nouveau Nom');
    });

    it('should fail to update with empty name', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ancien Nom',
      }).value!;

      // Act
      const result = project.updateName('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(project.name).toBe('Ancien Nom');
    });

    it('should fail to update with name exceeding 100 characters', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ancien Nom',
      }).value!;

      // Act
      const result = project.updateName('a'.repeat(101));

      // Assert
      expect(result.isFailure).toBe(true);
      expect(project.name).toBe('Ancien Nom');
    });
  });

  describe('updateDescription', () => {
    it('should update the description', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ma Collection',
      }).value!;

      // Act
      project.updateDescription('Nouvelle description');

      // Assert
      expect(project.description).toBe('Nouvelle description');
    });

    it('should allow empty description', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ma Collection',
        description: 'Description initiale',
      }).value!;

      // Act
      project.updateDescription('');

      // Assert
      expect(project.description).toBe('');
    });
  });

  describe('updateCoverImage', () => {
    it('should update the cover image', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ma Collection',
      }).value!;

      // Act
      project.updateCoverImage('https://example.com/new-image.jpg');

      // Assert
      expect(project.coverImage).toBe('https://example.com/new-image.jpg');
    });
  });

  describe('incrementProductCount', () => {
    it('should increment product count', () => {
      // Arrange
      const project = Project.create({
        creatorId: 'creator-123',
        name: 'Ma Collection',
      }).value!;

      // Act
      project.incrementProductCount();

      // Assert
      expect(project.productCount).toBe(1);
    });
  });

  describe('decrementProductCount', () => {
    it('should decrement product count', () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        productCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      // Act
      project.decrementProductCount();

      // Assert
      expect(project.productCount).toBe(4);
    });

    it('should not go below zero', () => {
      // Arrange
      const project = Project.reconstitute({
        id: 'project-123',
        creatorId: 'creator-123',
        name: 'Ma Collection',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).value!;

      // Act
      project.decrementProductCount();

      // Assert
      expect(project.productCount).toBe(0);
    });
  });
});
