import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    amount: { type: Number, required: true },
    transaction_id: { type: String, required: true },
    payment_status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paid_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
