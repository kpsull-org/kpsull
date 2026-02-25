import { describe, it, expect } from 'vitest';
import { Dispute } from '../dispute.entity';
import { DisputeType } from '../../value-objects';

describe('Dispute Entity', () => {
  describe('create', () => {
    it('should create a dispute with OPEN status', () => {
      // Arrange
      const props = {
        orderId: 'order-123',
        customerId: 'customer-456',
        type: DisputeType.damaged(),
        description: 'Le produit est arrive avec le carton ecrase',
      };

      // Act
      const result = Dispute.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.orderId).toBe('order-123');
      expect(result.value.customerId).toBe('customer-456');
      expect(result.value.type.isDamaged).toBe(true);
      expect(result.value.description).toBe('Le produit est arrive avec le carton ecrase');
      expect(result.value.status.isOpen).toBe(true);
      expect(result.value.createdAt).toBeDefined();
    });

    it.each([
      {
        label: 'orderId is missing',
        props: { orderId: '', customerId: 'customer-456', type: DisputeType.damaged(), description: 'Description du probleme avec le produit' },
        expectedError: 'commande',
      },
      {
        label: 'customerId is missing',
        props: { orderId: 'order-123', customerId: '', type: DisputeType.damaged(), description: 'Description du probleme avec le produit' },
        expectedError: 'client',
      },
      {
        label: 'description is too short',
        props: { orderId: 'order-123', customerId: 'customer-456', type: DisputeType.damaged(), description: 'Court' },
        expectedError: '10 caracteres',
      },
    ])('should fail when $label', ({ props, expectedError }) => {
      const result = Dispute.create(props);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(expectedError);
    });

    it('should trim description and validate', () => {
      // Arrange
      const props = {
        orderId: 'order-123',
        customerId: 'customer-456',
        type: DisputeType.damaged(),
        description: '   Description valide avec espaces   ',
      };

      // Act
      const result = Dispute.create(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.description).toBe('Description valide avec espaces');
    });
  });

  describe('startReview', () => {
    it('should transition from OPEN to UNDER_REVIEW', () => {
      // Arrange
      const dispute = createTestDispute();

      // Act
      const result = dispute.startReview();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(dispute.status.isUnderReview).toBe(true);
    });

    it('should fail if already under review', () => {
      // Arrange
      const dispute = createTestDispute();
      dispute.startReview();

      // Act
      const result = dispute.startReview();

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('resolve', () => {
    it('should resolve an open dispute', () => {
      // Arrange
      const dispute = createTestDispute();

      // Act
      const result = dispute.resolve('Remboursement effectue');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(dispute.status.isResolved).toBe(true);
      expect(dispute.resolution).toBe('Remboursement effectue');
      expect(dispute.resolvedAt).toBeDefined();
    });

    it('should resolve a dispute under review', () => {
      // Arrange
      const dispute = createTestDispute();
      dispute.startReview();

      // Act
      const result = dispute.resolve('Produit renvoye');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(dispute.status.isResolved).toBe(true);
    });

    it('should fail without resolution message', () => {
      // Arrange
      const dispute = createTestDispute();

      // Act
      const result = dispute.resolve('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('resolution');
    });

    it('should fail if already resolved', () => {
      // Arrange
      const dispute = createTestDispute();
      dispute.resolve('Deja resolu');

      // Act
      const result = dispute.resolve('Nouvelle resolution');

      // Assert
      expect(result.isFailure).toBe(true);
    });
  });

  describe('close', () => {
    it('should close an open dispute', () => {
      // Arrange
      const dispute = createTestDispute();

      // Act
      const result = dispute.close('Litige non recevable');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(dispute.status.isClosed).toBe(true);
      expect(dispute.resolution).toBe('Litige non recevable');
    });

    it('should close a dispute under review', () => {
      // Arrange
      const dispute = createTestDispute();
      dispute.startReview();

      // Act
      const result = dispute.close('Pas de preuve suffisante');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(dispute.status.isClosed).toBe(true);
    });

    it('should fail without reason', () => {
      // Arrange
      const dispute = createTestDispute();

      // Act
      const result = dispute.close('');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('raison');
    });
  });

  describe('close - status validation', () => {
    it('should fail when closing an already resolved dispute', () => {
      const dispute = createTestDispute();
      dispute.resolve('Deja resolu');

      const result = dispute.close('Raison');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('create - missing type and description', () => {
    it('should fail when type is missing', () => {
      const result = Dispute.create({
        orderId: 'order-123',
        customerId: 'customer-456',
        type: undefined as never,
        description: 'Description suffisamment longue',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('type');
    });

    it('should fail when description is empty', () => {
      const result = Dispute.create({
        orderId: 'order-123',
        customerId: 'customer-456',
        type: DisputeType.damaged(),
        description: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('description');
    });
  });

  describe('getters', () => {
    it('should return updatedAt', () => {
      const dispute = createTestDispute();

      expect(dispute.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a dispute from persistence', () => {
      // Arrange
      const now = new Date();
      const props = {
        id: 'dispute-123',
        orderId: 'order-123',
        customerId: 'customer-456',
        type: 'DAMAGED',
        description: 'Produit abime',
        status: 'UNDER_REVIEW',
        createdAt: now,
        updatedAt: now,
      };

      // Act
      const result = Dispute.reconstitute(props);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value.idString).toBe('dispute-123');
      expect(result.value.type.isDamaged).toBe(true);
      expect(result.value.status.isUnderReview).toBe(true);
    });

    it('should fail with invalid type', () => {
      // Arrange
      const now = new Date();
      const props = {
        id: 'dispute-123',
        orderId: 'order-123',
        customerId: 'customer-456',
        type: 'INVALID',
        description: 'Produit abime',
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
      };

      // Act
      const result = Dispute.reconstitute(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });

    it('should fail with invalid status', () => {
      // Arrange
      const now = new Date();
      const props = {
        id: 'dispute-123',
        orderId: 'order-123',
        customerId: 'customer-456',
        type: 'DAMAGED',
        description: 'Produit abime',
        status: 'INVALID',
        createdAt: now,
        updatedAt: now,
      };

      // Act
      const result = Dispute.reconstitute(props);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('invalide');
    });
  });
});

function createTestDispute(): Dispute {
  return Dispute.create({
    orderId: 'order-123',
    customerId: 'customer-456',
    type: DisputeType.damaged(),
    description: 'Le produit est arrive endommage',
  }).value;
}
