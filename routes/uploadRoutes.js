import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/image', verifyToken, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data required' });
    }

    const formData = new FormData();
    formData.append('key', process.env.IMGBB_API_KEY);
    formData.append('image', image);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ success: false, message: 'Image upload failed' });
    }

    res.json({ success: true, url: data.data.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
