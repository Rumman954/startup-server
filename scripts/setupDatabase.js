import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { resolveMongoUri } from '../config/getMongoUri.js';
import { initAuth } from '../config/auth.js';
import { seedAdmin } from '../utils/seedAdmin.js';
import '../models/User.js';
import '../models/Startup.js';
import '../models/Opportunity.js';
import '../models/Application.js';
import '../models/Payment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

const setupDatabase = async () => {
  const uri = await resolveMongoUri();
  console.log(`Connecting to: ${uri.replace(/:([^:@/]+)@/, ':****@')}`);

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads folder for local images.');
  }

  await mongoose.connect(uri);
  await initAuth();
  console.log('MongoDB connected.');

  await seedAdmin();

  const dbName = mongoose.connection.db.databaseName;
  const collections = await mongoose.connection.db.listCollections().toArray();

  console.log(`\n✅ Database "${dbName}" is ready.`);
  console.log(`   Collections: ${collections.length ? collections.map((c) => c.name).join(', ') : '(created on first use)'}`);
  console.log(`   Admin email: ${process.env.ADMIN_EMAIL || 'not set'}`);
  console.log('\nNext steps:');
  console.log('   1. cd server && npm run dev');
  console.log('   2. cd client && npm run dev');
  console.log('   3. Register at http://localhost:5173/register');
  console.log(`   Admin login: ${process.env.ADMIN_EMAIL || 'admin@startuplabs.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);

  await mongoose.disconnect();
  process.exit(0);
};

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err.message);
  if (err.message.includes('ECONNREFUSED')) {
    console.error('   Start MongoDB locally (Windows: Services → MongoDB Server).');
  }
  process.exit(1);
});
