import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return sendError(res, 'Missing "to" email address', 400);

    const result = await sendEmail({
      to,
      subject: 'Test SMTP Config',
      html: '<p>This is a test email to verify SMTP configuration on Render.</p>'
    });

    if (result) {
      return sendSuccess(res, { success: true }, 'Test email sent successfully');
    } else {
      return sendError(res, 'Failed to send test email. Check server logs for details.', 500);
    }
  } catch (error) {
    return sendError(res, error.message, 500);
  }
});

router.get('/dashboard', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalRevenue = (await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])[0]) || { total: 0 };
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');

    return sendSuccess(res, {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: totalRevenue.total,
      pendingOrders,
      recentOrders,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to fetch dashboard data', 500);
  }
});

router.get('/orders', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { orderStatus: status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone');
    const total = await Order.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return sendSuccess(res, { orders, page, pages, total });
  } catch (error) {
    return sendError(res, 'Failed to fetch orders', 500);
  }
});

router.patch('/orders/:id/status', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status }, { new: true }).populate('userId', 'name email');

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (order.userId && order.userId.email) {
      sendEmail({
        to: order.userId.email,
        subject: `Order Update #${order.orderNumber}: ${status.toUpperCase()}`,
        html: `<p>Hi ${order.userId.name},</p><p>Your order <strong>#${order.orderNumber}</strong> has been updated to: <strong>${status.toUpperCase()}</strong>.</p><p>Thank you for shopping with CD Store!</p>`
      });
    }

    return sendSuccess(res, order, 'Order status updated');
  } catch (error) {
    return sendError(res, 'Failed to update order status', 500);
  }
});

router.get('/analytics/revenue', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const revenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    return sendSuccess(res, revenue);
  } catch (error) {
    return sendError(res, 'Failed to fetch revenue analytics', 500);
  }
});

router.get('/analytics/products', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    ]);

    return sendSuccess(res, topProducts);
  } catch (error) {
    return sendError(res, 'Failed to fetch product analytics', 500);
  }
});

export default router;
