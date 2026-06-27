import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import connectDB from './config/db.js';
import { initAuth, getAuth } from './config/auth.js';
import { seedAdmin } from './utils/seedAdmin.js';
import authRoutes from './routes/authRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

const startServer = async () => {
  await connectDB();
  await initAuth();
  await seedAdmin();

  app.all('/api/auth/*', toNodeHandler(getAuth()));

  app.use(express.json({ limit: '10mb' }));

  app.get('/', (req, res) => {
    res.json({ message: 'StartupForge API is running' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/jwt', authRoutes);
  app.use('/api/startups', startupRoutes);
  app.use('/api/opportunities', opportunityRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/upload', uploadRoutes);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(console.error);
