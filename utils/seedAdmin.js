import mongoose from 'mongoose';
import User from '../models/User.js';
import { getAuth } from '../config/auth.js';

export const seedAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@startuplabs.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const name = 'Admin';

    if (!adminEmail) return;

    let user = await User.findOne({ email: adminEmail });
    if (!user) {
      user = await User.create({
        name,
        email: adminEmail,
        role: 'admin',
        image: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
      });
      console.log('Admin user profile created in database');
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      user.name = name;
      await user.save();
      console.log('Existing user promoted to admin');
    }

    const auth = getAuth();
    if (!auth) {
      console.warn('Auth not initialized — admin login account not created');
      return;
    }

    const db = mongoose.connection.db;
    const authUser = await db.collection('user').findOne({ email: adminEmail });

    if (!authUser) {
      const result = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name,
        },
      });

      if (result?.error) {
        console.error('Admin auth seed error:', result.error.message || result.error);
        return;
      }

      await db.collection('user').updateOne(
        { email: adminEmail },
        { $set: { role: 'admin', emailVerified: true } }
      );

      console.log(`Admin login ready: ${adminEmail} / ${adminPassword}`);
      return;
    }

    console.log(`Admin account already exists: ${adminEmail}`);
  } catch (error) {
    console.error('Admin seed error:', error.message);
  }
};
