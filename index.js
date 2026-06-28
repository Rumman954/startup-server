import { getApp } from './app.js';
import { getEnvStatus } from './utils/validateEnv.js';

const PORT = process.env.PORT || 5000;

export default async function handler(req, res) {
  if (req.url === '/api/env-status' || req.url?.startsWith('/api/env-status?')) {
    return res.status(200).json({
      success: true,
      data: getEnvStatus(),
      hint: 'Set missing variables in Vercel → Settings → Environment Variables, then redeploy.',
    });
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Server init failed:', error);

    const payload = {
      success: false,
      message: 'Server failed to start',
      error: error.message,
    };

    if (error.missing?.length) {
      payload.missingEnv = error.missing;
    }
    if (error.invalid?.length) {
      payload.invalidEnv = error.invalid;
    }

    if (!error.missing && !error.invalid) {
      payload.hint =
        'Most common fix: add a real MongoDB Atlas MONGODB_URI in Vercel env vars and redeploy.';
    }

    res.status(503).json(payload);
  }
}

if (!process.env.VERCEL) {
  getApp()
    .then((app) => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error.message);
      if (error.missing?.length) {
        console.error('Missing env:', error.missing.join(', '));
      }
      process.exit(1);
    });
}
