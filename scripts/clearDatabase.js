import 'dotenv/config';
import mongoose from 'mongoose';
import { resolveMongoUri } from '../config/getMongoUri.js';
import { initAuth } from '../config/auth.js';
import { seedAdmin } from '../utils/seedAdmin.js';

const clearDatabase = async () => {
  const uri = await resolveMongoUri();
  console.log(`Connecting to: ${uri.replace(/:([^:@/]+)@/, ':****@')}`);

  await mongoose.connect(uri);
  const dbName = mongoose.connection.db.databaseName;
  await mongoose.connection.db.dropDatabase();
  console.log(`✅ Cleared database "${dbName}" — all users and data removed.`);

  await initAuth();
  await seedAdmin();
  console.log('✅ Admin account re-seeded. Login with README credentials.');

  await mongoose.disconnect();
  process.exit(0);
};

clearDatabase().catch((err) => {
  console.error('Failed to clear database:', err.message);
  process.exit(1);
});
