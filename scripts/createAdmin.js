import 'dotenv/config';
import mongoose from 'mongoose';
import { resolveMongoUri } from '../config/getMongoUri.js';
import { initAuth } from '../config/auth.js';
import { seedAdmin } from '../utils/seedAdmin.js';

const createAdmin = async () => {
  const uri = await resolveMongoUri();
  console.log(`Connecting to: ${uri.replace(/:([^:@/]+)@/, ':****@')}`);

  await mongoose.connect(uri);
  await initAuth();
  await seedAdmin();

  console.log('\n✅ Admin setup complete.');
  console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@startuplabs.com'}`);
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  console.log('   Login at: http://localhost:5173/login');
  console.log('   Dashboard: http://localhost:5173/admin/dashboard\n');

  await mongoose.disconnect();
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
