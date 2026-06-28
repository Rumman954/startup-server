import express from 'express';
import User from '../models/User.js';
import Startup from '../models/Startup.js';
import Opportunity from '../models/Opportunity.js';
import Payment from '../models/Payment.js';
import Application from '../models/Application.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/overview', async (req, res) => {
  try {
    const [totalUsers, totalStartups, totalOpportunities, payments] = await Promise.all([
      User.countDocuments(),
      Startup.countDocuments(),
      Opportunity.countDocuments(),
      Payment.find({ payment_status: 'completed' }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: { totalUsers, totalStartups, totalOpportunities, totalRevenue },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payments = await Payment.find({ user_email: user.email }).sort({ paid_at: -1 }).lean();

    let startup = null;
    let opportunities = [];
    let applicationsSubmitted = [];

    if (user.role === 'founder') {
      startup = await Startup.findOne({ founder_email: user.email }).lean();
      const opps = await Opportunity.find({ founder_email: user.email })
        .populate('startup_id')
        .sort({ createdAt: -1 })
        .lean();

      const oppIds = opps.map((o) => o._id);
      const apps = oppIds.length
        ? await Application.find({ opportunity_id: { $in: oppIds } }).lean()
        : [];

      const applicantEmails = [...new Set(apps.map((a) => a.applicant_email))];
      const applicants = applicantEmails.length
        ? await User.find({ email: { $in: applicantEmails } }).select('name email skills bio').lean()
        : [];
      const applicantMap = Object.fromEntries(applicants.map((u) => [u.email, u]));

      opportunities = opps.map((opp) => ({
        ...opp,
        applications: apps
          .filter((a) => String(a.opportunity_id) === String(opp._id))
          .map((a) => ({
            ...a,
            applicant: applicantMap[a.applicant_email] || {
              name: a.applicant_email,
              email: a.applicant_email,
              skills: [],
              bio: '',
            },
          })),
      }));
    }

    if (user.role === 'collaborator') {
      const apps = await Application.find({ applicant_email: user.email })
        .sort({ applied_at: -1 })
        .lean();

      const oppIds = apps.map((a) => a.opportunity_id);
      const opps = oppIds.length
        ? await Opportunity.find({ _id: { $in: oppIds } }).populate('startup_id').lean()
        : [];
      const oppMap = Object.fromEntries(opps.map((o) => [String(o._id), o]));

      applicationsSubmitted = apps.map((app) => ({
        ...app,
        opportunity: oppMap[String(app.opportunity_id)] || null,
      }));
    }

    res.json({
      success: true,
      data: {
        user,
        payments,
        startup,
        opportunities,
        applicationsSubmitted,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/users/:id/unblock', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/startups', async (req, res) => {
  try {
    const startups = await Startup.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: startups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/startups/:id', async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id).lean();
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    const founder = await User.findOne({ email: startup.founder_email })
      .select('-__v')
      .lean();

    const payments = founder
      ? await Payment.find({ user_email: founder.email }).sort({ paid_at: -1 }).lean()
      : [];

    const opportunities = await Opportunity.find({ startup_id: startup._id })
      .sort({ createdAt: -1 })
      .lean();

    const oppIds = opportunities.map((o) => o._id);
    const apps = oppIds.length
      ? await Application.find({ opportunity_id: { $in: oppIds } }).lean()
      : [];

    const applicantEmails = [...new Set(apps.map((a) => a.applicant_email))];
    const applicants = applicantEmails.length
      ? await User.find({ email: { $in: applicantEmails } }).select('name email skills bio role').lean()
      : [];
    const applicantMap = Object.fromEntries(applicants.map((u) => [u.email, u]));

    const opportunitiesWithApps = opportunities.map((opp) => ({
      ...opp,
      applications: apps
        .filter((a) => String(a.opportunity_id) === String(opp._id))
        .map((a) => ({
          ...a,
          applicant: applicantMap[a.applicant_email] || {
            name: a.applicant_email,
            email: a.applicant_email,
            skills: [],
            bio: '',
            role: 'collaborator',
          },
        })),
    }));

    const totalApplications = apps.length;

    res.json({
      success: true,
      data: {
        startup,
        founder,
        payments,
        opportunities: opportunitiesWithApps,
        stats: {
          totalOpportunities: opportunities.length,
          totalApplications,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/startups/:id/approve', async (req, res) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!startup) return res.status(404).json({ success: false, message: 'Startup not found' });
    res.json({ success: true, data: startup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/startups/:id/remove', async (req, res) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      { new: true }
    );
    if (!startup) return res.status(404).json({ success: false, message: 'Startup not found' });
    res.json({ success: true, data: startup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Payment.find()
      .select('user_name user_email amount amount_paid currency paid_at payment_status')
      .sort({ paid_at: -1 })
      .lean();

    const emails = [...new Set(transactions.map((t) => t.user_email))];
    const users = await User.find({ email: { $in: emails } }).select('name email');
    const userMap = Object.fromEntries(users.map((u) => [u.email, u.name]));

    const data = transactions.map((tx) => ({
      _id: tx._id,
      user_name: tx.user_name || userMap[tx.user_email] || tx.user_email,
      user_email: tx.user_email,
      amount: tx.amount,
      paid_at: tx.paid_at,
      payment_status:
        tx.payment_status === 'failed'
          ? 'failed'
          : tx.payment_status === 'completed' || tx.paid_at
            ? 'completed'
            : 'pending',
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Payment.findById(req.params.id).lean();
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const user = await User.findOne({ email: transaction.user_email }).select('name email').lean();
    const paymentStatus =
      transaction.payment_status === 'failed'
        ? 'failed'
        : transaction.payment_status === 'completed' || transaction.paid_at
          ? 'completed'
          : 'pending';

    const data = {
      ...transaction,
      user_name: transaction.user_name || user?.name || transaction.user_email,
      payment_status: paymentStatus,
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
