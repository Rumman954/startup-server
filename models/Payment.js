import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user_name: { type: String, default: '' },
    user_email: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    amount_paid: { type: Number },
    transaction_id: { type: String, required: true, unique: true },
    payment_status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    payment_method: { type: String, default: 'card' },
    card_brand: { type: String, default: '' },
    card_last4: { type: String, default: '' },
    billing_country: { type: String, default: '' },
    customer_email: { type: String, default: '' },
    exchange_rate: { type: Number },
    plan: { type: String, default: '' },
    billing_interval: { type: String, enum: ['', 'monthly', 'yearly'], default: '' },
    paid_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
