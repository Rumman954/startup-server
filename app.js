import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { getPasswordValidationError } from './utils/validatePassword.js';
import { validateProductionEnv } from './utils/validateEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createApp() {
  validateProductionEnv();
  await connectDB();
  await initAuth();
  await seedAdmin();

  const app = express();

  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/auth/sign-up/email', (req, res, next) => {
    if (req.method !== 'POST') return next();
    const passwordError = getPasswordValidationError(req.body?.password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    next();
  });

  app.all('/api/auth/*', toNodeHandler(getAuth()));

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  });

  return app;
}

let appPromise;

export function getApp() {
  if (!appPromise) {
    appPromise = createApp().catch((error) => {
      appPromise = null;
      throw error;
    });
  }
  return appPromise;
}
