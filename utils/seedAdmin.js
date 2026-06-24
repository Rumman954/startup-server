import User from '../models/User.js';

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
      }
      return;
    }

    await User.create({
      name: 'Admin',
      email: adminEmail,
      role: 'admin',
      image: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
    });

    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Admin seed error:', error.message);
  }
};
