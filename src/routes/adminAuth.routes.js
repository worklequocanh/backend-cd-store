import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getLoginAlertEmail } from '../utils/emailTemplates.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch || user.role !== 'admin') {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.passwordHash;

    // Send login alert email
    const loginTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    sendEmail({
      to: user.email,
      subject: 'New Admin Login Alert - CD Store',
      html: getLoginAlertEmail(user.name, loginTime)
    });

    return sendSuccess(res, { user: userObj, token }, 'Admin login successful');
  } catch (error) {
    console.error('Admin login error:', error);
    return sendError(res, 'Server error during login', 500);
  }
});

export default router;
