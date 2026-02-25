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
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        returnId: 'non-existent',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail if not the creator owner', async () => {
      mockRepository.findById.mockResolvedValue(createRequestedReturn());

      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'different-creator',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorise');
    });

    it('should fail if return is not in REQUESTED status', async () => {
      mockRepository.findById.mockResolvedValue({ ...createRequestedReturn(), status: 'APPROVED' as const });

      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('en attente');
    });

    it.each([
      { label: 'without returnId', input: { returnId: '', creatorId: 'creator-123' }, errorContains: 'Return ID' },
      { label: 'without creatorId', input: { returnId: 'return-1', creatorId: '' }, errorContains: 'Creator ID' },
    ])('should fail $label', async ({ input, errorContains }) => {
      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(errorContains);
    });
  });
});
