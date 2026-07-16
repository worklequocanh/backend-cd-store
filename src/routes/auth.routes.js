import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendEmail } from '../utils/email.js';
import { getWelcomeEmail, getLoginAlertEmail, getOtpEmail } from '../utils/emailTemplates.js';
import { getJwtConfig } from '../config/jwt.js';
import { verifyGoogleToken } from '../services/googleAuth.service.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }
    
    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'User already exists', 400);
    }

    const user = new User({ name, email, passwordHash: password });
    await user.save();

    const jwtCfg = getJwtConfig();
    const token = jwt.sign({ id: user._id, role: user.role }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
    const refreshToken = jwt.sign({ id: user._id }, jwtCfg.refreshSecret, { expiresIn: jwtCfg.refreshExpiresIn });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: jwtCfg.cookieMaxAge });

    sendEmail({
      to: user.email,
      subject: 'Welcome to CD Store! 🎉',
      html: getWelcomeEmail(user.name)
    });

    return sendSuccess(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }, 'User registered successfully', 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal server error', 500);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid || user.role === 'admin') {
      return sendError(res, 'Invalid credentials', 401);
    }

    const jwtCfg = getJwtConfig();
    const token = jwt.sign({ id: user._id, role: user.role }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
    const refreshToken = jwt.sign({ id: user._id }, jwtCfg.refreshSecret, { expiresIn: jwtCfg.refreshExpiresIn });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: jwtCfg.cookieMaxAge });

    const loginTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    sendEmail({
      to: user.email,
      subject: 'New Login Alert - CD Store',
      html: getLoginAlertEmail(user.name, loginTime)
    });

    return sendSuccess(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }, 'Login successful');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal server error', 500);
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendError(res, 'Google credential token is required', 400);
    }

    const googleUser = await verifyGoogleToken(credential);
    if (!googleUser || !googleUser.email) {
      return sendError(res, 'Xác thực Google thất bại hoặc không hợp lệ', 401);
    }

    let user = await User.findOne({ email: googleUser.email });
    let isNewUser = false;

    if (!user) {
      const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + 'G!';
      user = new User({
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        passwordHash: randomPass,
        avatar: googleUser.picture || '',
        role: 'user',
        status: 'active'
      });
      await user.save();
      isNewUser = true;

      sendEmail({
        to: user.email,
        subject: 'Welcome to CD Store via Google! 🎉',
        html: getWelcomeEmail(user.name)
      });
    } else {
      if (googleUser.picture && (!user.avatar || user.avatar !== googleUser.picture)) {
        user.avatar = googleUser.picture;
        await user.save();
      }
    }

    if (user.status === 'inactive') {
      return sendError(res, 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động', 403);
    }

    const jwtCfg = getJwtConfig();
    const token = jwt.sign({ id: user._id, role: user.role }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
    const refreshToken = jwt.sign({ id: user._id }, jwtCfg.refreshSecret, { expiresIn: jwtCfg.refreshExpiresIn });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: jwtCfg.cookieMaxAge });

    if (!isNewUser) {
      const loginTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      sendEmail({
        to: user.email,
        subject: 'New Google Login Alert - CD Store',
        html: getLoginAlertEmail(user.name, loginTime)
      });
    }

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token,
      isNewUser
    }, 'Đăng nhập Google thành công!');
  } catch (error) {
    console.error('Google login error:', error);
    return sendError(res, 'Internal server error during Google login', 500);
  }
});

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return sendError(res, 'Refresh token not found', 401);
    }

    const jwtCfg = getJwtConfig();
    const decoded = jwt.verify(refreshToken, jwtCfg.refreshSecret);
    const token = jwt.sign({ id: decoded.id }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });

    return sendSuccess(res, { token }, 'Token refreshed');
  } catch (error) {
    return sendError(res, 'Invalid refresh token', 401);
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return sendError(res, 'No token provided', 401);
    }

    const decoded = jwt.verify(token, getJwtConfig().secret);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Invalid token', 401);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  return sendSuccess(res, null, 'Logged out successfully');
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'User not found', 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 mins
    await user.save();

    const { sendEmail } = await import('../utils/email.js');
    sendEmail({
      to: user.email,
      subject: 'Password Reset OTP - CD Store',
      html: getOtpEmail(otp)
    });

    return sendSuccess(res, null, 'OTP sent to email');
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, resetPasswordOtp: otp, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return sendError(res, 'Invalid or expired OTP', 400);

    return sendSuccess(res, { verifiedToken: otp }, 'OTP verified');
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (newPassword.length < 6) return sendError(res, 'Password must be at least 6 characters long', 400);

    const user = await User.findOne({ email, resetPasswordOtp: otp, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return sendError(res, 'Invalid or expired OTP', 400);

    user.passwordHash = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendSuccess(res, null, 'Password reset successful');
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
});

export default router;
