import express from 'express';
import Opportunity from '../models/Opportunity.js';
import Startup from '../models/Startup.js';
import User from '../models/User.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 9,
      search = '',
      workType = '',
      industry = '',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { role_title: { $regex: search, $options: 'i' } },
        { required_skills: { $regex: search, $options: 'i' } },
      ];
    }

    if (workType) {
      const types = workType.split(',').filter(Boolean);
      if (types.length) filter.work_type = { $in: types };
    }

    let opportunities = await Opportunity.find(filter)
      .populate('startup_id')
      .sort({ createdAt: -1 });

    if (industry) {
      const industries = industry.split(',').filter(Boolean);
      opportunities = opportunities.filter((opp) => {
        const startup = opp.startup_id;
        return startup && industries.includes(startup.industry);
      });
    }

    const total = opportunities.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = opportunities.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const opportunities = await Opportunity.find()
      .populate('startup_id')
      .sort({ createdAt: -1 })
      .limit(6);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/founder/mine', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ founder_email: req.user.email })
      .populate('startup_id')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id).populate('startup_id');
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder_email: req.user.email });
    if (!startup) {
      return res.status(400).json({ success: false, message: 'Create a startup profile first' });
    }

    const count = await Opportunity.countDocuments({ founder_email: req.user.email });
    const user = await User.findById(req.user._id);

    if (count >= 3 && !user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Premium required to post more than 3 opportunities',
        requiresPremium: true,
      });
    }

    const { role_title, required_skills, work_type, commitment_level, deadline } = req.body;

    const opportunity = await Opportunity.create({
      startup_id: startup._id,
      role_title,
      required_skills: Array.isArray(required_skills)
        ? required_skills
        : required_skills.split(',').map((s) => s.trim()),
      work_type,
      commitment_level,
      deadline,
      founder_email: req.user.email,
    });

    res.status(201).json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    if (opportunity.founder_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    if (opportunity.founder_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Opportunity deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
