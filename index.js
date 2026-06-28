import { getApp } from './app.js';

const PORT = process.env.PORT || 5000;

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Server init failed:', error);
    res.status(503).json({
      success: false,
      message: 'Server failed to start',
      error: process.env.NODE_ENV === 'production' ? 'Check server logs and environment variables' : error.message,
    });
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
      process.exit(1);
    });
}
