import { describe, it, expect } from 'vitest';
import {
  TrackingStatus,
  TrackingStatusLabels,
  TrackingStatusOrder,
} from '../tracking-status.vo';

describe('TrackingStatus Value Object', () => {
  describe('factory methods', () => {
    it('should create PENDING status', () => {
      const status = TrackingStatus.pending();

      expect(status.value).toBe('PENDING');
      expect(status.isPending).toBe(true);
      expect(status.label).toBe('En attente');
    });

    it('should create INFO_RECEIVED status', () => {
      const status = TrackingStatus.infoReceived();

      expect(status.value).toBe('INFO_RECEIVED');
      expect(status.isInfoReceived).toBe(true);
      expect(status.label).toBe('Informations recues');
    });

    it('should create IN_TRANSIT status', () => {
      const status = TrackingStatus.inTransit();

      expect(status.value).toBe('IN_TRANSIT');
      expect(status.isInTransit).toBe(true);
      expect(status.label).toBe('En transit');
    });

    it('should create OUT_FOR_DELIVERY status', () => {
      const status = TrackingStatus.outForDelivery();

      expect(status.value).toBe('OUT_FOR_DELIVERY');
      expect(status.isOutForDelivery).toBe(true);
      expect(status.label).toBe('En cours de livraison');
    });

    it('should create DELIVERED status', () => {
      const status = TrackingStatus.delivered();

      expect(status.value).toBe('DELIVERED');
      expect(status.isDelivered).toBe(true);
      expect(status.label).toBe('Livre');
    });

    it('should create FAILED_ATTEMPT status', () => {
      const status = TrackingStatus.failedAttempt();

      expect(status.value).toBe('FAILED_ATTEMPT');
      expect(status.isFailedAttempt).toBe(true);
      expect(status.label).toBe('Tentative echouee');
    });

    it('should create EXCEPTION status', () => {
      const status = TrackingStatus.exception();

      expect(status.value).toBe('EXCEPTION');
      expect(status.isException).toBe(true);
      expect(status.label).toBe('Probleme de livraison');
    });

    it('should create EXPIRED status', () => {
      const status = TrackingStatus.expired();

      expect(status.value).toBe('EXPIRED');
      expect(status.isExpired).toBe(true);
      expect(status.label).toBe('Expire');
    });
  });

  describe('fromString', () => {
    it('should create status from lowercase string', () => {
      const result = TrackingStatus.fromString('in_transit');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('IN_TRANSIT');
    });

    it('should create status from uppercase string', () => {
      const result = TrackingStatus.fromString('DELIVERED');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('DELIVERED');
    });

    it('should fail with invalid string', () => {
      const result = TrackingStatus.fromString('INVALID_STATUS');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Statut de suivi invalide: INVALID_STATUS');
    });
  });

  describe('fromAfterShipTag', () => {
    it('should map AfterShip Pending tag', () => {
      const result = TrackingStatus.fromAfterShipTag('Pending');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('PENDING');
    });

    it('should map AfterShip InfoReceived tag', () => {
      const result = TrackingStatus.fromAfterShipTag('InfoReceived');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('INFO_RECEIVED');
    });

    it('should map AfterShip InTransit tag', () => {
      const result = TrackingStatus.fromAfterShipTag('InTransit');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('IN_TRANSIT');
    });

    it('should map AfterShip OutForDelivery tag', () => {
      const result = TrackingStatus.fromAfterShipTag('OutForDelivery');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('OUT_FOR_DELIVERY');
    });

    it('should map AfterShip Delivered tag', () => {
      const result = TrackingStatus.fromAfterShipTag('Delivered');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('DELIVERED');
    });

    it('should map AfterShip AttemptFail tag', () => {
      const result = TrackingStatus.fromAfterShipTag('AttemptFail');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('FAILED_ATTEMPT');
    });

    it('should map AfterShip AvailableForPickup tag', () => {
      const result = TrackingStatus.fromAfterShipTag('AvailableForPickup');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('OUT_FOR_DELIVERY');
    });

    it('should map AfterShip Exception tag', () => {
      const result = TrackingStatus.fromAfterShipTag('Exception');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('EXCEPTION');
    });

    it('should map AfterShip Expired tag', () => {
      const result = TrackingStatus.fromAfterShipTag('Expired');

      expect(result.isSuccess).toBe(true);
      expect(result.value.value).toBe('EXPIRED');
    });

    it('should fail with unknown AfterShip tag', () => {
      const result = TrackingStatus.fromAfterShipTag('UnknownTag');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Tag AfterShip non reconnu: UnknownTag');
    });
  });

  describe('computed properties', () => {
    describe('isFinal', () => {
      it('should return true for DELIVERED', () => {
        expect(TrackingStatus.delivered().isFinal).toBe(true);
      });

      it('should return true for EXPIRED', () => {
        expect(TrackingStatus.expired().isFinal).toBe(true);
      });

      it('should return false for IN_TRANSIT', () => {
        expect(TrackingStatus.inTransit().isFinal).toBe(false);
      });

      it('should return false for EXCEPTION', () => {
        expect(TrackingStatus.exception().isFinal).toBe(false);
      });
    });

    describe('hasIssue', () => {
      it('should return true for FAILED_ATTEMPT', () => {
        expect(TrackingStatus.failedAttempt().hasIssue).toBe(true);
      });

      it('should return true for EXCEPTION', () => {
        expect(TrackingStatus.exception().hasIssue).toBe(true);
      });

      it('should return false for IN_TRANSIT', () => {
        expect(TrackingStatus.inTransit().hasIssue).toBe(false);
      });

      it('should return false for DELIVERED', () => {
        expect(TrackingStatus.delivered().hasIssue).toBe(false);
      });
    });

    describe('isActive', () => {
      it('should return true for PENDING', () => {
        expect(TrackingStatus.pending().isActive).toBe(true);
      });

      it('should return true for IN_TRANSIT', () => {
        expect(TrackingStatus.inTransit().isActive).toBe(true);
      });

      it('should return true for EXCEPTION', () => {
        expect(TrackingStatus.exception().isActive).toBe(true);
      });

      it('should return false for DELIVERED', () => {
        expect(TrackingStatus.delivered().isActive).toBe(false);
      });

      it('should return false for EXPIRED', () => {
        expect(TrackingStatus.expired().isActive).toBe(false);
      });
    });

    describe('order', () => {
      it('should return correct order for timeline display', () => {
        expect(TrackingStatus.pending().order).toBe(TrackingStatusOrder['PENDING']);
        expect(TrackingStatus.infoReceived().order).toBe(TrackingStatusOrder['INFO_RECEIVED']);
        expect(TrackingStatus.inTransit().order).toBe(TrackingStatusOrder['IN_TRANSIT']);
        expect(TrackingStatus.outForDelivery().order).toBe(TrackingStatusOrder['OUT_FOR_DELIVERY']);
        expect(TrackingStatus.delivered().order).toBe(TrackingStatusOrder['DELIVERED']);
      });
    });
  });

  describe('labels', () => {
    it('should have French labels for all statuses', () => {
      expect(TrackingStatusLabels['PENDING']).toBe('En attente');
      expect(TrackingStatusLabels['INFO_RECEIVED']).toBe('Informations recues');
      expect(TrackingStatusLabels['IN_TRANSIT']).toBe('En transit');
      expect(TrackingStatusLabels['OUT_FOR_DELIVERY']).toBe('En cours de livraison');
      expect(TrackingStatusLabels['DELIVERED']).toBe('Livre');
      expect(TrackingStatusLabels['FAILED_ATTEMPT']).toBe('Tentative echouee');
      expect(TrackingStatusLabels['EXCEPTION']).toBe('Probleme de livraison');
      expect(TrackingStatusLabels['EXPIRED']).toBe('Expire');
    });
  });

  describe('toString', () => {
    it('should return the status value', () => {
      const status = TrackingStatus.inTransit();

      expect(status.toString()).toBe('IN_TRANSIT');
    });
  });

  describe('equality', () => {
    it('should be equal for same status values', () => {
      const status1 = TrackingStatus.inTransit();
      const status2 = TrackingStatus.inTransit();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal for different status values', () => {
      const status1 = TrackingStatus.inTransit();
      const status2 = TrackingStatus.delivered();

      expect(status1.equals(status2)).toBe(false);
    });
  });
});
