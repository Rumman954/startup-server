import express from 'express';
import Startup from '../models/Startup.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { attachFounderNames } from '../utils/startupHelpers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status = 'approved' } = req.query;
    const filter = status ? { status } : {};
    const startups = await Startup.find(filter).sort({ createdAt: -1 }).limit(20);
    const data = await attachFounderNames(startups);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const startups = await Startup.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6);
    const data = await attachFounderNames(startups);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/founder/mine', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder_email: req.user.email });
    const data = startup ? await attachFounderNames(startup) : null;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }
    const data = await attachFounderNames(startup);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, requireRole('founder', 'admin'), async (req, res) => {
  try {
    const { startup_name, logo, industry, description, funding_stage, team_size_needed } = req.body;

    const existing = await Startup.findOne({ founder_email: req.user.email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a startup profile' });
    }

    const startup = await Startup.create({
      startup_name,
      logo,
      industry,
      description,
      funding_stage,
      founder_email: req.user.email,
      team_size_needed: team_size_needed || 5,
    });

    const data = await attachFounderNames(startup);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', verifyToken, requireRole('founder', 'admin'), async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (startup.founder_email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Startup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    const data = await attachFounderNames(updated);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', verifyToken, requireRole('founder', 'admin'), async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (startup.founder_email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Startup.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Startup deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
