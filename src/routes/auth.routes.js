import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'refresh', { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

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
    if (!isPasswordValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'refresh', { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

    return sendSuccess(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }, 'Login successful');
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal server error', 500);
  }
});

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return sendError(res, 'Refresh token not found', 401);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh');
    const token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
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

export default router;
