import Stripe from 'stripe';

export const PREMIUM_PRICE_USD = 29.99;
export const PREMIUM_PRICE_CENTS = 2999;

export const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(
    key &&
    key.startsWith('sk_') &&
    !key.includes('your_stripe') &&
    !key.endsWith('_key')
  );
};

let stripeClient = null;

export const getStripe = () => {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

export const createMockSessionId = (userId) =>
  `mock_${Date.now()}_${String(userId).slice(-8)}`;

export const isMockSessionId = (sessionId) =>
  typeof sessionId === 'string' && sessionId.startsWith('mock_');
