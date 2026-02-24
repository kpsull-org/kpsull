import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Hoisted mocks — must be defined before any module imports
const mockAuth = vi.hoisted(() => vi.fn());

const mockPrisma = vi.hoisted(() => ({
  cart: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  creatorPage: {
    findUnique: vi.fn(),
  },
  order: {
    create: vi.fn(),
  },
}));

const mockPaymentIntentsCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    paymentIntents: {
      create: mockPaymentIntentsCreate,
    },
  },
}));

import { POST } from '../create-session/route';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const validShippingAddress = {
  firstName: 'Jean',
  lastName: 'Dupont',
  street: '12 rue de la Paix',
  city: 'Paris',
  postalCode: '75001',
  country: 'FR',
};

const validCarrier = {
  carrier: 'chronopost' as const,
  carrierName: 'Chronopost',
  price: 599,
  estimatedDays: '1-2 jours',
};

const validBody = {
  shippingAddress: validShippingAddress,
  carrier: validCarrier,
  shippingMode: 'HOME_DELIVERY' as const,
};

const mockCartItems = [
  { productId: 'prod-1', name: 'T-shirt', price: 2500, quantity: 2, creatorSlug: 'creator-slug-1' },
  { productId: 'prod-2', name: 'Hoodie', price: 4000, quantity: 1, creatorSlug: 'creator-slug-1' },
];

const mockSession = { user: { id: 'user-1', email: 'jean@example.com' } };
const mockPaymentIntent = { id: 'pi_test_123', client_secret: 'pi_test_secret_123' };
const mockOrder = { id: 'order-uuid-1' };

const makeRequest = (body: unknown): NextRequest =>
  new NextRequest('http://localhost/api/checkout/create-session', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/checkout/create-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockPrisma.cart.findUnique.mockResolvedValue({ items: mockCartItems });
    mockPrisma.creatorPage.findUnique.mockResolvedValue({ creatorId: 'creator-id-1' });
    mockPaymentIntentsCreate.mockResolvedValue(mockPaymentIntent);
    mockPrisma.order.create.mockResolvedValue(mockOrder);
    mockPrisma.cart.update.mockResolvedValue({});
  });

  describe('happy path', () => {
    it('should return 200 with clientSecret and orderId when all inputs are valid', async () => {
      const response = await POST(makeRequest(validBody));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        clientSecret: 'pi_test_secret_123',
        orderId: 'order-uuid-1',
      });
    });

    it('should create the order with correct data', async () => {
      await POST(makeRequest(validBody));

      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'user-1',
            customerEmail: 'jean@example.com',
            status: 'PENDING',
            stripePaymentIntentId: 'pi_test_123',
            shippingMode: 'HOME_DELIVERY',
            carrier: 'chronopost',
          }),
          select: { id: true },
        })
      );
    });

    it('should clear the cart after creating the order', async () => {
      await POST(makeRequest(validBody));

      expect(mockPrisma.cart.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { items: [] },
      });
    });
  });

  describe('authentication', () => {
    it('should return 401 when there is no session', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const response = await POST(makeRequest(validBody));
      expect(response.status).toBe(401);
    });

    it('should return 401 when the session has no user id', async () => {
      mockAuth.mockResolvedValueOnce({ user: { email: 'jean@example.com' } });
      const response = await POST(makeRequest(validBody));
      expect(response.status).toBe(401);
    });

    it('should return 401 when the session has no email', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      const response = await POST(makeRequest(validBody));
      expect(response.status).toBe(401);
    });
  });

  describe('empty cart', () => {
    it('should return 400 with "Panier vide" when cart record does not exist', async () => {
      mockPrisma.cart.findUnique.mockResolvedValueOnce(null);
      const response = await POST(makeRequest(validBody));
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Panier vide');
    });

    it('should return 400 with "Panier vide" when cart has no items', async () => {
      mockPrisma.cart.findUnique.mockResolvedValueOnce({ items: [] });
      const response = await POST(makeRequest(validBody));
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Panier vide');
    });
  });

  describe('body validation', () => {
    it('should return 400 when shippingAddress is missing', async () => {
      const response = await POST(makeRequest({ carrier: validCarrier, shippingMode: 'HOME_DELIVERY' }));
      expect(response.status).toBe(400);
    });

    it('should return validation error details when body is invalid', async () => {
      const response = await POST(makeRequest({ carrier: validCarrier, shippingMode: 'HOME_DELIVERY' }));
      const body = await response.json();
      expect(body.error).toBe('Données invalides');
      expect(body.details).toBeDefined();
    });

    it('should return 400 when carrier is missing', async () => {
      const response = await POST(makeRequest({ shippingAddress: validShippingAddress, shippingMode: 'HOME_DELIVERY' }));
      expect(response.status).toBe(400);
    });

    it('should return 400 when the request body is not valid JSON', async () => {
      const request = new NextRequest('http://localhost/api/checkout/create-session', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('relay point', () => {
    it('should create the order with relayPointId and relayPointName when carrier has a relay point', async () => {
      const bodyWithRelay = {
        shippingAddress: validShippingAddress,
        carrier: {
          ...validCarrier,
          carrier: 'mondial-relay' as const,
          carrierName: 'Mondial Relay',
          relayPoint: {
            id: 'relay-001',
            name: 'Tabac du coin',
            address: '5 avenue de la République',
            city: 'Lyon',
            postalCode: '69001',
          },
        },
        shippingMode: 'RELAY_POINT' as const,
      };

      await POST(makeRequest(bodyWithRelay));

      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            relayPointId: 'relay-001',
            relayPointName: 'Tabac du coin',
            shippingMode: 'RELAY_POINT',
          }),
        })
      );
    });

    it('should create the order with null relayPointId when no relay point is provided', async () => {
      await POST(makeRequest(validBody));

      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            relayPointId: null,
            relayPointName: null,
          }),
        })
      );
    });
  });

  describe('Stripe PaymentIntent creation', () => {
    it('should call paymentIntents.create with the correct total amount in cents', async () => {
      // items: (2500 * 2) + (4000 * 1) = 9000; shipping: 599; total: 9599
      await POST(makeRequest(validBody));

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 9599,
          currency: 'eur',
        })
      );
    });

    it('should call paymentIntents.create with userId and shippingMode in metadata', async () => {
      await POST(makeRequest(validBody));

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user-1',
            shippingMode: 'HOME_DELIVERY',
          }),
        })
      );
    });

    it('should return 500 when Stripe throws an error', async () => {
      mockPaymentIntentsCreate.mockRejectedValueOnce(new Error('Stripe unavailable'));
      const response = await POST(makeRequest(validBody));
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toContain('Stripe');
    });
  });
});
