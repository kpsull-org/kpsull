/**
 * Checkout Schema Tests
 *
 * FIX-1.2: Tests for Zod validation of sessionStorage data
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ShippingAddressSchema,
  GuestCheckoutSchema,
  OrderConfirmationSchema,
  CartItemSchema,
  parseSessionStorage,
  storeSessionStorage,
} from '../checkout.schema';

describe('ShippingAddressSchema', () => {
  const validAddress = {
    firstName: 'Jean',
    lastName: 'Dupont',
    street: '123 rue de la Paix',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  };

  it('should validate a valid shipping address', () => {
    const result = ShippingAddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validAddress);
    }
  });

  it('should validate address with optional fields', () => {
    const addressWithOptional = {
      ...validAddress,
      streetComplement: 'Apt 5',
      phone: '0612345678',
    };
    const result = ShippingAddressSchema.safeParse(addressWithOptional);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const incomplete = { firstName: 'Jean' };
    const result = ShippingAddressSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('should reject invalid postal code format', () => {
    const invalidPostal = { ...validAddress, postalCode: '123' };
    const result = ShippingAddressSchema.safeParse(invalidPostal);
    expect(result.success).toBe(false);
    if (!result.success && result.error.issues[0]) {
      expect(result.error.issues[0].path).toContain('postalCode');
    }
  });

  it('should reject empty required fields', () => {
    const emptyFields = { ...validAddress, firstName: '' };
    const result = ShippingAddressSchema.safeParse(emptyFields);
    expect(result.success).toBe(false);
  });
});

describe('GuestCheckoutSchema', () => {
  it('should validate valid guest checkout data', () => {
    const guestData = { email: 'test@example.com' };
    const result = GuestCheckoutSchema.safeParse(guestData);
    expect(result.success).toBe(true);
  });

  it('should validate guest checkout with optional fields', () => {
    const guestData = {
      email: 'test@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      acceptsMarketing: true,
    };
    const result = GuestCheckoutSchema.safeParse(guestData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidEmail = { email: 'not-an-email' };
    const result = GuestCheckoutSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });

  it('should default acceptsMarketing to false', () => {
    const guestData = { email: 'test@example.com' };
    const result = GuestCheckoutSchema.safeParse(guestData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acceptsMarketing).toBe(false);
    }
  });
});

describe('CartItemSchema', () => {
  const validItem = {
    productId: 'prod-123',
    name: 'Test Product',
    price: 1999,
    quantity: 2,
  };

  it('should validate valid cart item', () => {
    const result = CartItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should validate cart item with image', () => {
    const itemWithImage = { ...validItem, image: 'https://example.com/img.jpg' };
    const result = CartItemSchema.safeParse(itemWithImage);
    expect(result.success).toBe(true);
  });

  it('should reject zero quantity', () => {
    const zeroQty = { ...validItem, quantity: 0 };
    const result = CartItemSchema.safeParse(zeroQty);
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const negativePrice = { ...validItem, price: -100 };
    const result = CartItemSchema.safeParse(negativePrice);
    expect(result.success).toBe(false);
  });
});

describe('OrderConfirmationSchema', () => {
  const validOrder = {
    orderId: 'ORD-ABC123',
    items: [
      {
        productId: 'prod-123',
        name: 'Test Product',
        price: 1999,
        quantity: 2,
      },
    ],
    total: 3998,
    shippingAddress: {
      firstName: 'Jean',
      lastName: 'Dupont',
      street: '123 rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
    paidAt: '2025-01-29T10:00:00.000Z',
  };

  it('should validate valid order confirmation', () => {
    const result = OrderConfirmationSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('should reject empty items array', () => {
    const emptyItems = { ...validOrder, items: [] };
    const result = OrderConfirmationSchema.safeParse(emptyItems);
    expect(result.success).toBe(false);
  });

  it('should reject invalid paidAt date', () => {
    const invalidDate = { ...validOrder, paidAt: 'not-a-date' };
    const result = OrderConfirmationSchema.safeParse(invalidDate);
    expect(result.success).toBe(false);
  });

  it('should reject missing orderId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orderId, ...noOrderId } = validOrder;
    const result = OrderConfirmationSchema.safeParse(noOrderId);
    expect(result.success).toBe(false);
  });
});

describe('parseSessionStorage', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    });
  });

  it('should return success with valid data', () => {
    const validAddress = {
      firstName: 'Jean',
      lastName: 'Dupont',
      street: '123 rue',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    };
    sessionStorage.setItem('test', JSON.stringify(validAddress));

    const result = parseSessionStorage('test', ShippingAddressSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Jean');
    }
  });

  it('should return failure for missing key', () => {
    const result = parseSessionStorage('nonexistent', ShippingAddressSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeNull();
    }
  });

  it('should return failure and remove invalid data', () => {
    sessionStorage.setItem('test', JSON.stringify({ invalid: 'data' }));

    const result = parseSessionStorage('test', ShippingAddressSchema);
    expect(result.success).toBe(false);
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('test');
  });

  it('should handle corrupted JSON', () => {
    sessionStorage.setItem('test', 'not{valid}json');

    const result = parseSessionStorage('test', ShippingAddressSchema);
    expect(result.success).toBe(false);
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('test');
  });
});

describe('storeSessionStorage', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    });
  });

  it('should store valid data and return true', () => {
    const validAddress = {
      firstName: 'Jean',
      lastName: 'Dupont',
      street: '123 rue',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    };

    const result = storeSessionStorage('test', validAddress, ShippingAddressSchema);
    expect(result).toBe(true);
    expect(sessionStorage.setItem).toHaveBeenCalled();
  });

  it('should reject invalid data and return false', () => {
    const invalidAddress = { firstName: 'Jean' };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = storeSessionStorage('test', invalidAddress, ShippingAddressSchema);
    expect(result).toBe(false);
    expect(sessionStorage.setItem).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
