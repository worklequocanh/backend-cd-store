import express from 'express';
import multer from 'multer';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken } from '../middlewares/auth.js';
import { storage } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage });

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }
    return sendSuccess(res, { url: req.file.path }, 'File uploaded successfully', 201);
  } catch (error) {
    console.error('Upload error:', error);
    return sendError(res, 'Failed to upload file', 500);
  }
});

export default router;
