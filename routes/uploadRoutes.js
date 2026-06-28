import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { uploadImage } from '../utils/uploadToImgBB.js';

const router = express.Router();

router.post('/image', verifyToken, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data required' });
    }

    const url = await uploadImage(image);
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
