import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'StartupForge Premium Founder Package',
              description: 'Post unlimited opportunities for your startup',
            },
            unit_amount: 4999,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/founder/dashboard`,
      metadata: { userEmail: req.user.email },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const existing = await Payment.findOne({ transaction_id: session.id });
    if (existing) {
      return res.json({ success: true, message: 'Payment already recorded', data: existing });
    }

    const payment = await Payment.create({
      user_email: req.user.email,
      amount: session.amount_total / 100,
      transaction_id: session.id,
      payment_status: 'completed',
      paid_at: new Date(),
    });

    await User.findByIdAndUpdate(req.user._id, { isPremium: true });

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
