import express from 'express';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  createMockSessionId,
  getStripe,
  isMockSessionId,
  isStripeConfigured,
} from '../utils/stripeClient.js';
import {
  PREMIUM_PLANS,
  getPlanPrice,
  getPlanProductName,
  getPlanRank,
} from '../utils/premiumPlans.js';

const router = express.Router();

const addBillingPeriod = (billing) => {
  const expires = new Date();
  if (billing === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setMonth(expires.getMonth() + 1);
  }
  return expires;
};

const buildPaymentRecord = (user, sessionId, plan, billing, details = {}) => {
  const amount = getPlanPrice(plan, billing);
  return {
    user_name: user.name || '',
    user_email: user.email,
    amount,
    currency: details.currency || 'usd',
    amount_paid: details.amount_paid ?? amount,
    transaction_id: sessionId,
    payment_status: 'completed',
    payment_method: details.payment_method || 'card',
    card_brand: details.card_brand || '',
    card_last4: details.card_last4 || '',
    billing_country: details.billing_country || '',
    customer_email: details.customer_email || user.email,
    exchange_rate: details.exchange_rate,
    plan,
    billing_interval: billing,
    paid_at: new Date(),
  };
};

const completePremiumPurchase = async (user, sessionId, plan, billing, details = {}) => {
  const existing = await Payment.findOne({ transaction_id: sessionId });
  const update = {
    isPremium: true,
    premiumPlan: plan,
    premiumBilling: billing,
    premiumExpiresAt: addBillingPeriod(billing),
  };

  if (existing) {
    if (existing.payment_status !== 'completed') {
      existing.payment_status = 'completed';
      await existing.save();
    }
    await User.findByIdAndUpdate(user._id, update);
    return existing;
  }

  const payment = await Payment.create(buildPaymentRecord(user, sessionId, plan, billing, details));
  await User.findByIdAndUpdate(user._id, update);
  return payment;
};

const extractStripePaymentDetails = (session, fallbackAmount) => ({
  currency: session.currency || 'usd',
  amount_paid: session.amount_total ? session.amount_total / 100 : fallbackAmount,
  customer_email: session.customer_details?.email || session.customer_email || '',
  billing_country: session.customer_details?.address?.country || '',
  payment_method: 'card',
});

router.get('/plans', (_req, res) => {
  res.json({ success: true, data: PREMIUM_PLANS });
});

router.post('/create-checkout', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const plan = req.body?.plan;
    const billing = req.body?.billing === 'yearly' ? 'yearly' : 'monthly';

    if (!PREMIUM_PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const currentRank = getPlanRank(req.user.premiumPlan);
    const selectedRank = getPlanRank(plan);
    if (selectedRank <= currentRank && req.user.isPremium) {
      return res.status(400).json({ success: false, message: 'You already have this plan or higher' });
    }

    const amount = getPlanPrice(plan, billing);
    const amountCents = Math.round(amount * 100);

    if (!isStripeConfigured()) {
      const sessionId = createMockSessionId(req.user._id);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const params = new URLSearchParams({ session_id: sessionId, plan, billing });

      console.warn('\n💳 Stripe not configured — using demo checkout (development only)\n');

      return res.json({
        success: true,
        mock: true,
        sessionId,
        plan,
        billing,
        amount,
        url: `${clientUrl}/payment-checkout?${params.toString()}`,
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      adaptive_pricing: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: getPlanProductName(plan, billing),
              description: PREMIUM_PLANS[plan].tagline,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/premium`,
      metadata: {
        userEmail: req.user.email,
        userName: req.user.name || '',
        plan,
        billing,
      },
    });

    res.json({
      success: true,
      mock: false,
      url: session.url,
      sessionId: session.id,
      plan,
      billing,
      amount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const { sessionId, paymentDetails = {}, plan: bodyPlan, billing: bodyBilling } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID required' });
    }

    if (isMockSessionId(sessionId)) {
      const plan = bodyPlan || paymentDetails.plan;
      const billing = bodyBilling || paymentDetails.billing || 'monthly';
      if (!PREMIUM_PLANS[plan]) {
        return res.status(400).json({ success: false, message: 'Plan required for verification' });
      }
      const payment = await completePremiumPurchase(req.user, sessionId, plan, billing, paymentDetails);
      return res.json({ success: true, mock: true, data: payment });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ success: false, message: 'Stripe is not configured' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const plan = session.metadata?.plan;
    const billing = session.metadata?.billing || 'monthly';
    if (!PREMIUM_PLANS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan in payment session' });
    }

    const amount = getPlanPrice(plan, billing);
    const payment = await completePremiumPurchase(
      req.user,
      session.id,
      plan,
      billing,
      extractStripePaymentDetails(session, amount)
    );
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', verifyToken, requireRole('founder', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user_email: req.user.email };
    const transactions = await Payment.find(filter).sort({ paid_at: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
