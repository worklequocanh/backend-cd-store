import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { helmetSecurity, sanitizeData, apiLimiter, authLimiter } from './src/middlewares/security.js';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import productRoutes from './src/routes/product.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import couponRoutes from './src/routes/coupon.routes.js';
import reviewRoutes from './src/routes/review.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import adminAuthRoutes from './src/routes/adminAuth.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
import contactRoutes from './src/routes/contact.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmetSecurity);
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeData);
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'cd-store-api', timestamp: new Date() }));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin/auth', authLimiter, adminAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/contact', contactRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Connect to MongoDB and start server
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cd-store');
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
