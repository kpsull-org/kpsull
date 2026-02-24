import { loadStripe } from '@stripe/stripe-js';

/**
 * Stripe publishable key instance (browser-safe).
 *
 * Used by @stripe/react-stripe-js to mount Stripe Elements.
 * The promise is created once at module level to avoid re-instantiation.
 */
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

export { stripePromise };
