/**
 * Checkout Session Storage Schemas
 *
 * FIX-1.2: Validation SessionStorage avec Zod
 *
 * These schemas validate data stored in sessionStorage during checkout flow.
 * Using Zod ensures type safety and prevents injection of malformed data.
 */
import { z } from 'zod';

/**
 * Shipping address schema matching the ShippingAddress interface
 * from shipping-address-form.tsx
 */
export const ShippingAddressSchema = z.object({
  firstName: z.string().min(1, 'Prenom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  street: z.string().min(1, 'Adresse requise'),
  streetComplement: z.string().optional(),
  city: z.string().min(1, 'Ville requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  country: z.string().min(1, 'Pays requis'),
  phone: z.string().optional(),
});

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

/**
 * Guest checkout schema for unauthenticated users
 */
export const GuestCheckoutSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(1, 'Prenom requis').optional(),
  lastName: z.string().min(1, 'Nom requis').optional(),
  acceptsMarketing: z.boolean().optional().default(false),
});

export type GuestCheckout = z.infer<typeof GuestCheckoutSchema>;

/**
 * Cart item schema for order confirmation
 */
export const CartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

/**
 * Order confirmation schema stored after successful payment
 */
export const OrderConfirmationSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(CartItemSchema).min(1),
  total: z.number().int().nonnegative(),
  shippingAddress: ShippingAddressSchema,
  paidAt: z.string().datetime({ message: 'Date de paiement invalide' }),
});

export type OrderConfirmation = z.infer<typeof OrderConfirmationSchema>;

/**
 * Helper function to safely parse sessionStorage data with Zod schema
 *
 * @param key - sessionStorage key
 * @param schema - Zod schema to validate against
 * @returns Parsed data or null if invalid/missing
 */
export function parseSessionStorage<T>(
  key: string,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: z.ZodError | null } {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      return { success: false, error: null };
    }

    const parsed = JSON.parse(stored);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    // Remove invalid data from sessionStorage
    sessionStorage.removeItem(key);
    return { success: false, error: result.error };
  } catch {
    // JSON.parse failed - remove corrupted data
    sessionStorage.removeItem(key);
    return { success: false, error: null };
  }
}

/**
 * Helper to safely store validated data in sessionStorage
 *
 * @param key - sessionStorage key
 * @param data - Data to store
 * @param schema - Zod schema to validate against before storing
 * @returns true if stored successfully, false otherwise
 */
export function storeSessionStorage<T>(
  key: string,
  data: T,
  schema: z.ZodType<T>
): boolean {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`Invalid data for sessionStorage key "${key}":`, result.error);
    return false;
  }

  sessionStorage.setItem(key, JSON.stringify(result.data));
  return true;
}
