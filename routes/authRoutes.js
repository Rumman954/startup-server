import express from 'express';
import User from '../models/User.js';
import { generateToken, setTokenCookie, verifyToken } from '../middleware/auth.js';
import { getAuth } from '../config/auth.js';

const router = express.Router();

router.post('/issue-jwt', async (req, res) => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return res.status(401).json({ success: false, message: 'No active session' });
    }

    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      user = await User.create({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image || '',
        role: session.user.email === process.env.ADMIN_EMAIL ? 'admin' : (session.user.role || 'collaborator'),
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account blocked' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        skills: user.skills,
        bio: user.bio,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      image: req.user.image,
      role: req.user.role,
      skills: req.user.skills,
      bio: req.user.bio,
      isPremium: req.user.isPremium,
    },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/sync-user', async (req, res) => {
  try {
    const { name, email, image, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email required' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const userRole = email === process.env.ADMIN_EMAIL ? 'admin' : (role || 'collaborator');
      user = await User.create({
        name,
        email,
        image: image || '',
        role: userRole,
      });
    } else {
      if (image) user.image = image;
      if (name) user.name = name;
      if (email === process.env.ADMIN_EMAIL) {
        user.role = 'admin';
      } else if (role && user.role !== 'admin') {
        user.role = role;
      }
      await user.save();
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
