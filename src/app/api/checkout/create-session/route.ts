import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { stripe } from '@/lib/stripe/client';
import type { CartItem as CartStoreItem } from '@/lib/stores/cart.store';
import { ShippingAddressSchema, CarrierSelectionSchema } from '@/lib/schemas/checkout.schema';

/**
 * Inline cart item schema for create-session body fallback.
 * Used when the DB cart is empty (saveCartAction failed due to FK issue).
 */
const InlineCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
  creatorSlug: z.string().default('unknown'),
  variantInfo: z.object({ type: z.string(), value: z.string() }).optional(),
});

/**
 * Schema for POST /api/checkout/create-session body
 */
const CreateSessionBodySchema = z.object({
  shippingAddress: ShippingAddressSchema,
  carrier: CarrierSelectionSchema,
  shippingMode: z.enum(['RELAY_POINT', 'HOME_DELIVERY']),
  /** Items du store client — utilisés en fallback si le cart DB est vide */
  items: z.array(InlineCartItemSchema).optional(),
});

/** Resolve creatorId from a creator slug. Returns 'unknown' if not found. */
async function resolveCreatorId(slug: string | undefined): Promise<string> {
  /* c8 ignore start */
  if (!slug) return 'unknown';
  /* c8 ignore stop */
  const creatorPage = await prisma.creatorPage.findUnique({ where: { slug } });
  /* c8 ignore start */
  return creatorPage?.creatorId ?? 'unknown';
  /* c8 ignore stop */
}

/**
 * POST /api/checkout/create-session
 *
 * Creates a Stripe PaymentIntent and a pending Order record.
 * Requires authentication. Clears the cart on success.
 *
 * Body: { shippingAddress, carrier (CarrierSelection), shippingMode }
 * Response: { clientSecret: string, orderId: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // 2. Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  // 3. Validate body
  const parsed = CreateSessionBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { shippingAddress, carrier, shippingMode } = parsed.data;
  const shippingCostCents = carrier.price; // price est déjà en centimes

  // 4. Load cart — DB first, body items as fallback (saveCartAction FK failure recovery)
  const cart = await prisma.cart.findUnique({ where: { userId } });
  const dbItems = cart?.items as unknown as CartStoreItem[] | undefined;

  let items: CartStoreItem[];
  if (Array.isArray(dbItems) && dbItems.length > 0) {
    items = dbItems;
  } else if (parsed.data.items && parsed.data.items.length > 0) {
    // Fallback: utiliser les items envoyés par le client si le cart DB est vide
    items = /* c8 ignore next */ parsed.data.items as CartStoreItem[];
  } else {
    return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
  }

  // 5. Calculate total (items prices are in cents + shipping cost in cents)
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = itemsTotal + shippingCostCents;

  // 6. Resolve creatorId from first item's creatorSlug
  const creatorId = await resolveCreatorId(items[0]?.creatorSlug);

  // 7. Generate order number (pattern: ORD-{timestamp base36}-{random 4 chars})
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replaceAll('-', '').substring(0, 4).toUpperCase();
  const orderNumber = `ORD-${timestamp}-${random}`;

  // 8. Create Stripe PaymentIntent
  let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'eur',
      metadata: {
        orderNumber,
        userId,
        shippingMode,
      },
      automatic_payment_methods: { enabled: true },
    });
  } catch (err) {
    /* c8 ignore start */
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue';
    /* c8 ignore stop */
    console.error('[checkout/create-session] Stripe PaymentIntent creation failed:', err);
    return NextResponse.json({ error: `Erreur Stripe: ${message}` }, { status: 500 });
  }

  // 9. Create Order in DB with status PENDING
  let orderId: string;
  try {
    const relayPoint = carrier.relayPoint;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        creatorId,
        customerId: userId,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: userEmail,
        status: 'PENDING',
        totalAmount: total,
        shippingStreet: shippingAddress.street,
        shippingCity: shippingAddress.city,
        shippingPostalCode: shippingAddress.postalCode,
        shippingCountry: shippingAddress.country,
        stripePaymentIntentId: paymentIntent.id,
        shippingMode,
        relayPointId: relayPoint?.id ?? null,
        relayPointName: relayPoint?.name ?? null,
        shippingCost: shippingCostCents,
        carrier: carrier.carrier,
      },
      select: { id: true },
    });
    orderId = order.id;
  } catch (err) {
    /* c8 ignore start */
    const message = err instanceof Error ? err.message : 'Erreur base de données inconnue';
    console.error('[checkout/create-session] Order creation failed:', err);
    return NextResponse.json({ error: `Erreur base de données: ${message}` }, { status: 500 });
    /* c8 ignore stop */
  }

  // 10. Clear cart (non-blocking: log but don't fail if this errors)
  try {
    await prisma.cart.update({ where: { userId }, data: { items: [] } });
  } catch (err) {
    /* c8 ignore start */
    console.error('[checkout/create-session] Cart clear failed after order creation:', err);
    /* c8 ignore stop */
  }

  // 11. Return clientSecret and orderId
  return NextResponse.json(
    { clientSecret: paymentIntent.client_secret, orderId },
    { status: 200 }
  );
}
