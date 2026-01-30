import { describe, it, expect } from 'vitest';
import { TrackingEvent } from '../tracking-event.entity';
import { TrackingStatus } from '../../value-objects/tracking-status.vo';

describe('TrackingEvent Entity', () => {
  describe('create', () => {
    it('should create a tracking event with required fields', () => {
      const result = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'Package in transit',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.trackingNumber).toBe('1Z999AA10123456784');
      expect(result.value.status.isInTransit).toBe(true);
      expect(result.value.message).toBe('Package in transit');
      expect(result.value.location).toBeNull();
      expect(result.value.timestamp).toBeInstanceOf(Date);
    });

    it('should create a tracking event with all fields', () => {
      const timestamp = new Date('2025-01-15T10:30:00Z');
      const result = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'DELIVERED',
        message: 'Package delivered',
        location: 'Paris, France',
        timestamp,
        rawData: { raw_status: 'Delivered' },
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.location).toBe('Paris, France');
      expect(result.value.timestamp).toEqual(timestamp);
      expect(result.value.rawData).toEqual({ raw_status: 'Delivered' });
    });

    it('should accept TrackingStatus as status parameter', () => {
      const status = TrackingStatus.outForDelivery();
      const result = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status,
        message: 'Out for delivery',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.status.isOutForDelivery).toBe(true);
    });

    it('should fail with empty tracking number', () => {
      const result = TrackingEvent.create({
        trackingNumber: '',
        status: 'IN_TRANSIT',
        message: 'Package in transit',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Le numero de suivi est requis');
    });

    it('should fail with whitespace-only tracking number', () => {
      const result = TrackingEvent.create({
        trackingNumber: '   ',
        status: 'IN_TRANSIT',
        message: 'Package in transit',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Le numero de suivi est requis');
    });

    it('should fail with empty message', () => {
      const result = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Le message est requis');
    });

    it('should fail with invalid status', () => {
      const result = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'INVALID_STATUS' as 'IN_TRANSIT',
        message: 'Package in transit',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Statut de suivi invalide: INVALID_STATUS');
    });

    it('should trim tracking number and message', () => {
      const result = TrackingEvent.create({
        trackingNumber: '  1Z999AA10123456784  ',
        status: 'IN_TRANSIT',
        message: '  Package in transit  ',
        location: '  Paris, France  ',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.trackingNumber).toBe('1Z999AA10123456784');
      expect(result.value.message).toBe('Package in transit');
      expect(result.value.location).toBe('Paris, France');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a tracking event from persistence data', () => {
      const timestamp = new Date('2025-01-15T10:30:00Z');
      const result = TrackingEvent.reconstitute({
        id: 'event-123',
        trackingNumber: '1Z999AA10123456784',
        status: 'DELIVERED',
        message: 'Package delivered',
        location: 'Paris, France',
        timestamp,
        rawData: null,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.id.value).toBe('event-123');
      expect(result.value.trackingNumber).toBe('1Z999AA10123456784');
      expect(result.value.status.isDelivered).toBe(true);
    });

    it('should fail with invalid status in reconstitute', () => {
      const result = TrackingEvent.reconstitute({
        id: 'event-123',
        trackingNumber: '1Z999AA10123456784',
        status: 'INVALID',
        message: 'Package delivered',
        location: null,
        timestamp: new Date(),
        rawData: null,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Statut de suivi invalide: INVALID');
    });
  });

  describe('fromAfterShipCheckpoint', () => {
    it('should create event from AfterShip checkpoint data', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'InTransit',
        message: 'Package departed facility',
        city: 'Paris',
        country_name: 'France',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.trackingNumber).toBe('1Z999AA10123456784');
      expect(result.value.status.isInTransit).toBe(true);
      expect(result.value.message).toBe('Package departed facility');
      expect(result.value.location).toBe('Paris, France');
    });

    it('should use location field if provided', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'Delivered',
        message: 'Delivered',
        location: 'Front Door',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.location).toBe('Front Door');
    });

    it('should build location from city and country', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'InTransit',
        message: 'In transit',
        city: 'Lyon',
        country_name: 'France',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.location).toBe('Lyon, France');
    });

    it('should handle city only', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'InTransit',
        message: 'In transit',
        city: 'Lyon',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.location).toBe('Lyon');
    });

    it('should use raw_status as fallback message', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'InTransit',
        message: '',
        raw_status: 'RAW_STATUS_MESSAGE',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.message).toBe('RAW_STATUS_MESSAGE');
    });

    it('should use status label as final fallback message', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'InTransit',
        message: '',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.message).toBe('En transit');
    });

    it('should store raw checkpoint data', () => {
      const checkpoint = {
        tag: 'Delivered',
        message: 'Delivered',
        checkpoint_time: '2025-01-15T10:30:00Z',
      };

      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', checkpoint);

      expect(result.isSuccess).toBe(true);
      expect(result.value.rawData).toBeDefined();
      expect(result.value.rawData).toEqual(expect.objectContaining({ tag: 'Delivered' }));
    });

    it('should fail with unknown AfterShip tag', () => {
      const result = TrackingEvent.fromAfterShipCheckpoint('1Z999AA10123456784', {
        tag: 'UnknownTag',
        message: 'Unknown',
        checkpoint_time: '2025-01-15T10:30:00Z',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Tag AfterShip non reconnu: UnknownTag');
    });
  });

  describe('computed properties', () => {
    it('should return formatted location', () => {
      const eventWithLocation = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'In transit',
        location: 'Paris, France',
      }).value;

      const eventWithoutLocation = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'In transit',
      }).value;

      expect(eventWithLocation.formattedLocation).toBe('Paris, France');
      expect(eventWithoutLocation.formattedLocation).toBe('Localisation inconnue');
    });

    it('should return formatted timestamp in French', () => {
      const event = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'In transit',
        timestamp: new Date('2025-01-15T10:30:00Z'),
      }).value;

      const formatted = event.formattedTimestamp;
      // Should contain date parts in French format
      expect(formatted).toMatch(/\d{1,2}/); // day
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // time
    });
  });

  describe('identity', () => {
    it('should have unique id', () => {
      const event1 = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'In transit',
      }).value;

      const event2 = TrackingEvent.create({
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'In transit',
      }).value;

      expect(event1.id.equals(event2.id)).toBe(false);
    });

    it('should preserve id when reconstituted', () => {
      const event = TrackingEvent.reconstitute({
        id: 'fixed-id-123',
        trackingNumber: '1Z999AA10123456784',
        status: 'IN_TRANSIT',
        message: 'In transit',
        location: null,
        timestamp: new Date(),
        rawData: null,
      }).value;

      expect(event.id.value).toBe('fixed-id-123');
    });
  });
});
