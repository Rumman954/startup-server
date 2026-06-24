import express from 'express';
import Application from '../models/Application.js';
import Opportunity from '../models/Opportunity.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, requireRole('collaborator'), async (req, res) => {
  try {
    const { opportunity_id, portfolio_link, motivation } = req.body;

    const opportunity = await Opportunity.findById(opportunity_id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    const existing = await Application.findOne({
      opportunity_id,
      applicant_email: req.user.email,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Already applied to this opportunity' });
    }

    const application = await Application.create({
      opportunity_id,
      applicant_email: req.user.email,
      portfolio_link,
      motivation,
      status: 'pending',
      applied_at: new Date(),
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/mine', verifyToken, requireRole('collaborator'), async (req, res) => {
  try {
    const applications = await Application.find({ applicant_email: req.user.email })
      .populate({
        path: 'opportunity_id',
        populate: { path: 'startup_id' },
      })
      .sort({ applied_at: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/founder/all', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ founder_email: req.user.email });
    const oppIds = opportunities.map((o) => o._id);

    const applications = await Application.find({ opportunity_id: { $in: oppIds } })
      .populate('opportunity_id')
      .sort({ applied_at: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/status', verifyToken, requireRole('founder'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('opportunity_id');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.opportunity_id.founder_email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
