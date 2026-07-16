import express from 'express';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { sendEmail } from '../utils/email.js';
import { getProfileUpdateEmail } from '../utils/emailTemplates.js';

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

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Failed to fetch profile', 500);
  }
});

router.put(['/profile', '/me'], verifyToken, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone, address, avatar }, { new: true }).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendEmail({
      to: user.email,
      subject: 'Security Alert: Your Profile Was Updated',
      html: getProfileUpdateEmail(user.name)
    });

    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update profile', 500);
  }
});

router.patch(['/profile', '/me'], verifyToken, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, phone, address, avatar }, { new: true }).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendEmail({
      to: user.email,
      subject: 'Security Alert: Your Profile Was Updated',
      html: getProfileUpdateEmail(user.name)
    });

    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update profile', 500);
  }
});

router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current and new password are required', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    user.passwordHash = newPassword;
    await user.save();

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 'Failed to change password', 500);
  }
});

router.put('/change-password', verifyToken, async (req, res) => {
  req.url = '/change-password';
  return router.handle(req, res);
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
      html: getProfileUpdateEmail(user.name)
    });

    return sendSuccess(res, user, 'User updated');
  } catch (error) {
    return sendError(res, 'Failed to update user', 500);
  }
});

router.patch('/:id/role', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 'Invalid role', 400);
    }
    
    // Prevent self-demotion
    if (req.user.id === req.params.id && role === 'user') {
      return sendError(res, 'You cannot demote yourself', 400);
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'User role updated');
  } catch (error) {
    return sendError(res, 'Failed to update user role', 500);
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
