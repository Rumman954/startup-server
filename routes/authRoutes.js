import express from 'express';
import User from '../models/User.js';
import { generateToken, setTokenCookie, verifyToken } from '../middleware/auth.js';
import { getAuth } from '../config/auth.js';
import { uploadImage } from '../utils/uploadToImgBB.js';

const router = express.Router();

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  image: user.image,
  role: user.role,
  skills: user.skills,
  bio: user.bio,
  isPremium: user.isPremium,
  premiumPlan: user.premiumPlan || '',
  premiumBilling: user.premiumBilling || '',
});

const findOrCreateAppUser = async (sessionUser) => {
  let user = await User.findOne({ email: sessionUser.email });

  if (!user) {
    user = await User.create({
      name: sessionUser.name,
      email: sessionUser.email,
      image: sessionUser.image || '',
      role:
        sessionUser.email === process.env.ADMIN_EMAIL
          ? 'admin'
          : sessionUser.role || 'collaborator',
    });
  }

  return user;
};

/** Credential login in one request — fixes cross-origin Better Auth session cookies on Vercel */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const auth = getAuth();
    const result = await auth.api.signInEmail({
      body: { email: email.trim(), password },
      headers: req.headers,
    });

    if (result?.error) {
      return res.status(401).json({
        success: false,
        message: result.error.message || 'Invalid email or password',
      });
    }

    const sessionUser = result?.user || result?.data?.user;
    if (!sessionUser?.email) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = await findOrCreateAppUser(sessionUser);

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account blocked' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({ success: true, user: formatUserResponse(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/issue-jwt', async (req, res) => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return res.status(401).json({ success: false, message: 'No active session' });
    }

    let user = await findOrCreateAppUser(session.user);

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account blocked' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  res.json({
    success: true,
    user: formatUserResponse(req.user),
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
    const { name, email, image, imageBase64, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email required' });
    }

    let imageUrl = image || '';

    if (imageBase64) {
      try {
        imageUrl = await uploadImage(imageBase64);
      } catch (uploadError) {
        return res.status(400).json({ success: false, message: uploadError.message });
      }
    } else if (image && !/^https?:\/\//i.test(image)) {
      return res.status(400).json({ success: false, message: 'Image must be a valid URL or uploaded file' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Profile image is required' });
      }
      const userRole = email === process.env.ADMIN_EMAIL ? 'admin' : (role || 'collaborator');
      user = await User.create({
        name,
        email,
        image: imageUrl,
        role: userRole,
      });
    } else {
      if (imageUrl) user.image = imageUrl;
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
