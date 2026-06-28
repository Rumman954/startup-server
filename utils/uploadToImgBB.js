import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const hasImgBBKey = () =>
  process.env.IMGBB_API_KEY &&
  process.env.IMGBB_API_KEY !== 'your-imgbb-api-key';

const saveLocalImage = async (imageBase64) => {
  await fs.mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(imageBase64, 'base64'));
  const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${filename}`;
};

const postToImgBB = async (imageBase64) => {
  const formData = new FormData();
  formData.append('key', process.env.IMGBB_API_KEY);
  formData.append('image', imageBase64);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Image upload failed');
  }

  return data.data.url;
};

/** Upload to ImgBB when configured; otherwise save locally in development. */
export const uploadImage = async (imageBase64) => {
  if (!imageBase64) {
    throw new Error('Image data required');
  }

  if (hasImgBBKey()) {
    return postToImgBB(imageBase64);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('IMGBB_API_KEY is not configured on server');
  }

  console.warn('📷 IMGBB_API_KEY not set — saving image locally (development only)');
  return saveLocalImage(imageBase64);
};
