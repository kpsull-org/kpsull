import { describe, it, expect, beforeEach } from 'vitest';
import { RejectReturnUseCase } from '../reject-return.use-case';
import type { ReturnRepository } from '../../ports/return.repository.interface';
import { createRequestedReturn, createMockReturnRepository, type MockReturnRepository } from './return.fixtures';

describe('RejectReturnUseCase', () => {
  let useCase: RejectReturnUseCase;
  let mockRepository: MockReturnRepository;

  beforeEach(() => {
    mockRepository = createMockReturnRepository();
    useCase = new RejectReturnUseCase(mockRepository as unknown as ReturnRepository);
  });

  describe('execute', () => {
    it('should reject a requested return with reason', async () => {
      // Arrange
      const returnRequest = createRequestedReturn();
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
        reason: 'Delai de retour depasse',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('REJECTED');
      expect(result.value.rejectionReason).toBe('Delai de retour depasse');
      expect(result.value.rejectedAt).toBeInstanceOf(Date);
    });

    it('should persist the rejected return', async () => {
      // Arrange
      const returnRequest = createRequestedReturn();
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
        reason: 'Produit utilise',
      });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'return-1',
          status: 'REJECTED',
          rejectionReason: 'Produit utilise',
        })
      );
    });

    it('should trim the reason', async () => {
      // Arrange
      const returnRequest = createRequestedReturn();
      mockRepository.findById.mockResolvedValue(returnRequest);

      // Act
      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
        reason: '  Raison avec espaces  ',
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.rejectionReason).toBe('Raison avec espaces');
    });

    it('should fail if return not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        returnId: 'non-existent',
        creatorId: 'creator-123',
        reason: 'Raison',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('non trouvee');
    });

    it('should fail if not the creator owner', async () => {
      mockRepository.findById.mockResolvedValue(createRequestedReturn());

      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'different-creator',
        reason: 'Raison',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('autorise');
    });

    it('should fail if return is not in REQUESTED status', async () => {
      mockRepository.findById.mockResolvedValue({ ...createRequestedReturn(), status: 'REJECTED' as const });

      const result = await useCase.execute({
        returnId: 'return-1',
        creatorId: 'creator-123',
        reason: 'Raison',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('en attente');
    });

    it.each([
      { label: 'without reason', input: { returnId: 'return-1', creatorId: 'creator-123', reason: '' }, errorContains: 'motif', needsReturn: true },
      { label: 'without returnId', input: { returnId: '', creatorId: 'creator-123', reason: 'Raison' }, errorContains: 'Return ID', needsReturn: false },
      { label: 'without creatorId', input: { returnId: 'return-1', creatorId: '', reason: 'Raison' }, errorContains: 'Creator ID', needsReturn: false },
    ])('should fail $label', async ({ input, errorContains, needsReturn }) => {
      if (needsReturn) {
        mockRepository.findById.mockResolvedValue(createRequestedReturn());
      }

      const result = await useCase.execute(input);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(errorContains);
    });
  });
});
