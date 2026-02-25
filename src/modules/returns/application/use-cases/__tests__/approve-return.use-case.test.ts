import { describe, it, expect, beforeEach } from 'vitest';
import { ApproveReturnUseCase } from '../approve-return.use-case';
import type { ReturnRepository } from '../../ports/return.repository.interface';
import { createRequestedReturn, createMockReturnRepository, type MockReturnRepository } from './return.fixtures';

describe('ApproveReturnUseCase', () => {
  let useCase: ApproveReturnUseCase;
  let mockRepository: MockReturnRepository;

  beforeEach(() => {
    mockRepository = createMockReturnRepository();
    useCase = new ApproveReturnUseCase(mockRepository as unknown as ReturnRepository);
  });

  describe('execute', () => {
    it('should approve a requested return', async () => {
      // Arrange
      const returnRequest = createRequestedReturn();
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('APPROVED');
      expect(result.value.approvedAt).toBeInstanceOf(Date);
    });

    it('should persist the approved return', async () => {
      // Arrange
      const returnRequest = createRequestedReturn();
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
      });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'return-1',
          status: 'APPROVED',
        })
      );
    });

    it('should fail if return not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await useCase.execute({
        returnId: 'non-existent',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail if not the creator owner', async () => {
      // Arrange
      const returnRequest = createRequestedReturn();
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'different-creator',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorise');
    });

    it('should fail if return is not in REQUESTED status', async () => {
      // Arrange
      const returnRequest = { ...createRequestedReturn(), status: 'APPROVED' as const };
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('en attente');
    });

    it('should fail without returnId', async () => {
      // Act
      const result = await useCase.execute({
        returnId: '',
        creatorId: 'creator-123',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Return ID');
    });

    it('should fail without creatorId', async () => {
      // Act
      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: '',
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Creator ID');
    });
  });
});
