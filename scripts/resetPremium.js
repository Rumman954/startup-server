import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { resolveMongoUri } from '../config/getMongoUri.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: node scripts/resetPremium.js <email>');
  console.error('Example: node scripts/resetPremium.js john@gmail.com');
  process.exit(1);
}

const resetPremium = async () => {
  const uri = await resolveMongoUri();
  console.log(`Connecting to: ${uri.replace(/:([^:@/]+)@/, ':****@')}`);

  await mongoose.connect(uri);

  const user = await User.findOneAndUpdate(
    { email },
    { isPremium: false, premiumPlan: '', premiumBilling: '', premiumExpiresAt: null },
    { new: true }
  );
  const payments = await Payment.deleteMany({ user_email: email });

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const authResult = await db.collection('user').updateOne(
    { email },
    { $set: { isPremium: false, premiumPlan: '', premiumBilling: '' } }
  );
  await client.close();

  if (!user) {
    console.warn(`⚠️  No mongoose user found for ${email}`);
  } else {
    console.log(`✅ Premium removed for ${user.name} (${email})`);
  }

  console.log(`✅ Deleted ${payments.deletedCount} transaction(s)`);
  if (authResult.matchedCount) {
    console.log('✅ Updated better-auth user record');
  }

  await mongoose.disconnect();
  process.exit(0);
};

resetPremium().catch((err) => {
  console.error('Failed to reset premium:', err.message);
  process.exit(1);
});
