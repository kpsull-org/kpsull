import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

// Mock prisma BEFORE importing anything that uses it
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    cart: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock auth BEFORE importing actions
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { prisma } from '@/lib/prisma/client';
import { auth } from '@/lib/auth';
import {
  getCartAction,
  saveCartAction,
  clearCartAction,
} from '../actions';
import type { CartItem } from '@/lib/stores/cart.store';

const mockAuth = vi.mocked(auth);
const mockCartFindUnique = vi.mocked(prisma.cart.findUnique);
const mockCartUpsert = vi.mocked(prisma.cart.upsert);

const validCartItem: CartItem = {
  productId: 'prod-123',
  name: 'Test Product',
  price: 2999,
  quantity: 1,
  creatorSlug: 'creator-slug',
};

describe('Cart Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCartAction', () => {
    it('should return empty array when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null as never);
      const result = await getCartAction();
      expect(result).toEqual([]);
      expect(prisma.cart.findUnique).not.toHaveBeenCalled();
    });

    it('should return empty array when session has no user id', async () => {
      mockAuth.mockResolvedValue({ user: {} } as never);
      const result = await getCartAction();
      expect(result).toEqual([]);
      expect(prisma.cart.findUnique).not.toHaveBeenCalled();
    });

    it('should return empty array when cart does not exist in DB', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      mockCartFindUnique.mockResolvedValue(null);
      const result = await getCartAction();
      expect(result).toEqual([]);
      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return cart items when cart exists', async () => {
      const dbItems = [validCartItem];
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      mockCartFindUnique.mockResolvedValue({ items: dbItems } as never);
      const result = await getCartAction();
      expect(result).toEqual(dbItems);
    });

    it('should query cart by authenticated user id', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-456' } } as never);
      mockCartFindUnique.mockResolvedValue({ items: [] } as never);
      await getCartAction();
      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
      });
    });
  });

  describe('saveCartAction', () => {
    it('should return success false when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null as never);
      const result = await saveCartAction([validCartItem]);
      expect(result).toEqual({ success: false, error: 'Non authentifié' });
      expect(prisma.cart.upsert).not.toHaveBeenCalled();
    });

    it('should return success false when session has no user id', async () => {
      mockAuth.mockResolvedValue({ user: {} } as never);
      const result = await saveCartAction([validCartItem]);
      expect(result.success).toBe(false);
      expect(prisma.cart.upsert).not.toHaveBeenCalled();
    });

    it('should return success false with error when items are invalid (missing creatorSlug)', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const invalidItem = {
        productId: 'prod-123',
        name: 'Test Product',
        price: 2999,
        quantity: 1,
      } as CartItem;
      const result = await saveCartAction([invalidItem]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Items invalides');
      expect(prisma.cart.upsert).not.toHaveBeenCalled();
    });

    it('should return success false with error when item has empty creatorSlug', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const invalidItem: CartItem = { ...validCartItem, creatorSlug: '' };
      const result = await saveCartAction([invalidItem]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Items invalides');
      expect(prisma.cart.upsert).not.toHaveBeenCalled();
    });

    it('should return success true and call prisma.cart.upsert when items are valid', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      mockCartUpsert.mockResolvedValue({} as never);
      const result = await saveCartAction([validCartItem]);
      expect(result).toEqual({ success: true });
      expect(prisma.cart.upsert).toHaveBeenCalledOnce();
    });

    it('should upsert with correct userId and items', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      mockCartUpsert.mockResolvedValue({} as never);
      await saveCartAction([validCartItem]);
      expect(prisma.cart.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          create: expect.objectContaining({ userId: 'user-123' }),
          update: expect.objectContaining({}),
        })
      );
    });

    it('should return success true for empty valid items array', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      mockCartUpsert.mockResolvedValue({} as never);
      const result = await saveCartAction([]);
      expect(result).toEqual({ success: true });
      expect(prisma.cart.upsert).toHaveBeenCalledOnce();
    });

    it('should return success false with error when price is negative', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const invalidItem: CartItem = { ...validCartItem, price: -100 };
      const result = await saveCartAction([invalidItem]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Items invalides');
    });

    it('should return SESSION_EXPIRED when prisma throws P2003', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const p2003Error = new Prisma.PrismaClientKnownRequestError('FK violation', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      mockCartUpsert.mockRejectedValue(p2003Error);

      const result = await saveCartAction([validCartItem]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SESSION_EXPIRED');
    });

    it('should rethrow non-P2003 errors from saveCartAction', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const genericError = new Error('Connection failed');
      mockCartUpsert.mockRejectedValue(genericError);

      await expect(saveCartAction([validCartItem])).rejects.toThrow('Connection failed');
    });
  });

  describe('clearCartAction', () => {
    it('should return success false when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null as never);
      const result = await clearCartAction();
      expect(result).toEqual({ success: false });
      expect(prisma.cart.upsert).not.toHaveBeenCalled();
    });

    it('should upsert cart with empty items array when authenticated', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      mockCartUpsert.mockResolvedValue({} as never);
      const result = await clearCartAction();
      expect(result).toEqual({ success: true });
      expect(prisma.cart.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: { userId: 'user-123', items: [] },
        update: { items: [] },
      });
    });

    it('should return success true after clearing cart', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-456' } } as never);
      mockCartUpsert.mockResolvedValue({} as never);
      const result = await clearCartAction();
      expect(result.success).toBe(true);
    });

    it('should return success false when clearCartAction throws P2003', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const p2003Error = new Prisma.PrismaClientKnownRequestError('FK violation', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      mockCartUpsert.mockRejectedValue(p2003Error);

      const result = await clearCartAction();

      expect(result.success).toBe(false);
    });

    it('should rethrow non-P2003 errors from clearCartAction', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } } as never);
      const genericError = new Error('DB down');
      mockCartUpsert.mockRejectedValue(genericError);

      await expect(clearCartAction()).rejects.toThrow('DB down');
    });
  });
});
