import express from 'express';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

router.get('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const users = await User.find().select('-passwordHash').skip(skip).limit(limit);
    const total = await User.countDocuments();
    const pages = Math.ceil(total / limit);

    return sendSuccess(res, { users, page, pages, total }, 'Users fetched', 200);
  } catch (error) {
    return sendError(res, 'Failed to fetch users', 500);
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Failed to fetch user', 500);
  }
});

router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return sendError(res, 'Access forbidden', 403);
    }

    const { name, phone, address, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, phone, address, avatar }, { new: true }).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendEmail({
      to: user.email,
      subject: 'Security Alert: Your Profile Was Updated',
      html: `<p>Hi ${user.name},</p><p>Your profile information (name, phone, address, or avatar) has been updated successfully.</p><p>If you did not make this change, please contact support immediately or change your password.</p>`
    });

    return sendSuccess(res, user, 'User updated');
  } catch (error) {
    return sendError(res, 'Failed to update user', 500);
  }
});

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, null, 'User deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete user', 500);
  }
});

export default router;
