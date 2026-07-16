import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Contact from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

router.get('/test-email', async (req, res) => {
  try {
    const to = req.query.to;
    if (!to) return sendError(res, 'Missing "to" query parameter. Example: ?to=your@email.com', 400);

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
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg[0] || { total: 0 };
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const unreadContacts = await Contact.countDocuments({ status: 'unread' });

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');
    const recentContacts = await Contact.find().sort({ createdAt: -1 }).limit(5);

    return sendSuccess(res, {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: totalRevenue.total,
      pendingOrders,
      unreadContacts,
      recentOrders,
      recentContacts,
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

// GET /api/admin/contacts - List all contact messages with filtering and pagination
router.get('/contacts', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Contact.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return sendSuccess(res, { contacts, page, pages, total });
  } catch (error) {
    return sendError(res, 'Failed to fetch contact messages', 500);
  }
});

// PATCH /api/admin/contacts/:id/status - Update contact status / admin notes
router.patch('/contacts/:id/status', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updateFields = {};
    if (status) {
      updateFields.status = status;
      if (status === 'replied' && !req.body.repliedAt) {
        updateFields.repliedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      updateFields.adminNotes = adminNotes;
    }

    const contact = await Contact.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!contact) {
      return sendError(res, 'Contact message not found', 404);
    }

    return sendSuccess(res, contact, 'Contact message updated');
  } catch (error) {
    return sendError(res, 'Failed to update contact message', 500);
  }
});

// POST /api/admin/contacts/:id/reply - Reply to a customer via email
router.post('/contacts/:id/reply', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { subject, replyMessage } = req.body;
    if (!replyMessage || !replyMessage.trim()) {
      return sendError(res, 'Vui lòng nhập nội dung phản hồi cho khách hàng.', 400);
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return sendError(res, 'Không tìm thấy lời nhắn liên hệ', 404);
    }

    const emailSubject = subject || `[CD Store] Phản hồi yêu cầu hỗ trợ: ${contact.subject}`;

    // Send email to customer
    await sendEmail({
      to: contact.email,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Xin chào ${contact.name},</h2>
          <p>Cảm ơn bạn đã liên hệ với <strong>CD Store</strong>. Dưới đây là nội dung phản hồi từ bộ phận chăm sóc khách hàng của chúng tôi về yêu cầu hỗ trợ của bạn:</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e293b;">${replyMessage.replace(/\n/g, '<br />')}</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #64748b; margin-top: 24px;">
            <p style="margin: 0 0 6px 0;"><strong>Lời nhắn gốc của bạn (${contact.subject}):</strong></p>
            <p style="margin: 0; font-style: italic;">"${contact.message}"</p>
          </div>
          <p style="margin-top: 24px;">Nếu có bất kỳ thắc mắc nào khác, bạn có thể trả lời trực tiếp email này hoặc liên hệ Hotline <strong>1900 888 999</strong>.</p>
          <p>Trân trọng,<br /><strong>Đội ngũ CSKH CD Store</strong></p>
        </div>
      `
    });

    // Update status to 'replied' and append note
    const timestamp = new Date().toLocaleString('vi-VN');
    const newNote = `[Đã gửi email phản hồi lúc ${timestamp}]: ${replyMessage}`;
    contact.status = 'replied';
    contact.repliedAt = new Date();
    contact.adminNotes = contact.adminNotes ? `${contact.adminNotes}\n\n${newNote}` : newNote;
    
    await contact.save();

    return sendSuccess(res, contact, 'Đã gửi email phản hồi thành công và cập nhật trạng thái!');
  } catch (error) {
    console.error('Error replying to contact:', error);
    return sendError(res, 'Có lỗi xảy ra khi gửi email phản hồi. Vui lòng kiểm tra cấu hình SMTP hoặc thử lại.', 500);
  }
});

// DELETE /api/admin/contacts/:id - Delete a contact message
router.delete('/contacts/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return sendError(res, 'Contact message not found', 404);
    }
    return sendSuccess(res, { id: req.params.id }, 'Contact message deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete contact message', 500);
  }
});

export default router;
