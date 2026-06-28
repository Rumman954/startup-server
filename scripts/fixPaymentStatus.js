import 'dotenv/config';
import mongoose from 'mongoose';
import { resolveMongoUri } from '../config/getMongoUri.js';
import Payment from '../models/Payment.js';

const fixPaymentStatus = async () => {
  const uri = await resolveMongoUri();
  await mongoose.connect(uri);

  const result = await Payment.updateMany(
    {
      paid_at: { $exists: true, $ne: null },
      payment_status: { $ne: 'failed' },
      $or: [{ payment_status: 'pending' }, { payment_status: { $exists: false } }],
    },
    { $set: { payment_status: 'completed' } }
  );

  console.log(`✅ Updated ${result.modifiedCount} payment(s) to completed.`);

  await mongoose.disconnect();
  process.exit(0);
};

fixPaymentStatus().catch((err) => {
  console.error('Failed to fix payment status:', err.message);
  process.exit(1);
});
