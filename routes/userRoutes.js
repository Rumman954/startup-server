import express from 'express';
import User from '../models/User.js';
import Opportunity from '../models/Opportunity.js';
import Application from '../models/Application.js';
import Startup from '../models/Startup.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, image, skills, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(image && { image }),
        ...(skills && { skills: Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim()) }),
        ...(bio !== undefined && { bio }),
      },
      { new: true }
    );

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

router.get('/founder/stats', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'founder') {
      return res.status(403).json({ success: false, message: 'Founder access only' });
    }

    const [totalOpportunities, opportunities, startup] = await Promise.all([
      Opportunity.countDocuments({ founder_email: req.user.email }),
      Opportunity.find({ founder_email: req.user.email }),
      Startup.findOne({ founder_email: req.user.email }),
    ]);

    const oppIds = opportunities.map((o) => o._id);
    const applications = await Application.find({ opportunity_id: { $in: oppIds } });
    const totalApplications = applications.length;
    const acceptedMembers = applications.filter((a) => a.status === 'accepted').length;

    res.json({
      success: true,
      data: { totalOpportunities, totalApplications, acceptedMembers, startup },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
