import express from 'express';
import Newsletter from '../models/Newsletter.js';
import Coupon from '../models/Coupon.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendEmail } from '../utils/email.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/newsletter/subscribe (or /api/newsletter) - Subscribe for VIP privilege and get VIP100 code
router.post(['/', '/subscribe'], async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Vui lòng nhập địa chỉ email của bạn.', 400);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 'Địa chỉ email không hợp lệ.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if coupon VIP100 exists in DB or create fallback info
    const couponInfo = await Coupon.findOne({ code: 'VIP100', isActive: true }) || {
      code: 'VIP100',
      value: 10,
      type: 'fixed',
      minOrderValue: 100
    };

    // Check if already subscribed
    let subscriber = await Newsletter.findOne({ email: cleanEmail });
    if (subscriber) {
      return sendSuccess(res, {
        email: cleanEmail,
        couponCode: couponInfo.code || 'VIP100',
        discountAmount: '$10.00 (100K VND)',
        minOrderValue: '$100',
        isExisting: true
      }, 'Bạn đã đăng ký nhận ưu đãi VIP trước đó. Hãy kiểm tra mã voucher bên dưới nhé!');
    }

    // Create new subscriber
    subscriber = await Newsletter.create({
      email: cleanEmail,
      isActive: true,
      subscribedAt: new Date()
    });

    // Send confirmation email asynchronously (non-blocking)
    sendEmail({
      to: cleanEmail,
      subject: '[CD Store] 🎉 Chúc mừng bạn đã trở thành Thành Viên VIP - Nhận ngay Voucher $10.00 (VIP100)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">ĐẶC QUYỀN THÀNH VIÊN VIP</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Chào mừng bạn đến với cộng đồng đam mê công nghệ & âm thanh chất lượng cao CD Store</p>
          </div>
          <div style="padding: 30px 25px;">
            <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${cleanEmail}</strong>,</p>
            <p style="line-height: 1.6; color: #475569;">Cảm ơn bạn đã đăng ký nhận thông tin từ <strong>CD Store</strong>. Bạn sẽ nhận được sớm nhất thông báo về các đợt mở bán siêu phẩm công nghệ, mã giảm giá độc quyền và các bí kíp tối ưu thiết bị số từ chuyên gia.</p>
            
            <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
              <span style="font-size: 12px; font-weight: bold; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">Mã Giảm Giá Độc Quyền Dành Cho Bạn</span>
              <div style="font-size: 32px; font-weight: 900; color: #1e293b; font-family: monospace; letter-spacing: 3px; margin: 8px 0;">VIP100</div>
              <p style="margin: 0; font-size: 14px; color: #10b981; font-weight: bold;">Giảm ngay $10.00 (100.000₫) cho đơn hàng từ $100</p>
            </div>

            <p style="font-size: 14px; color: #64748b;">* Mã giảm giá có hiệu lực áp dụng ngay tại bước thanh toán khi mua hàng tại website CD Store.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173/shop" style="display: inline-block; background: #4f46e5; color: white; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px;">Khám Phá Siêu Phẩm Ngay ↗</a>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 15px 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0;">Bạn nhận được email này vì đã đăng ký nhận bản tin tại CD Store.<br />Miễn phí 100% • Hủy đăng ký bất kỳ lúc nào • Bảo mật thông tin tuyệt đối</p>
          </div>
        </div>
      `
    }).catch(err => console.error('Error sending VIP confirmation email:', err));

    return sendSuccess(res, {
      email: cleanEmail,
      couponCode: couponInfo.code || 'VIP100',
      discountAmount: '$10.00 (100K VND)',
      minOrderValue: '$100',
      isExisting: false
    }, '🎉 Đăng ký đặc quyền VIP thành công! Bạn đã nhận được mã giảm giá VIP100.', 201);
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return sendError(res, 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.', 500);
  }
});

// GET /api/newsletter - Admin get all subscribers
router.get('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
    return sendSuccess(res, subscribers);
  } catch (error) {
    return sendError(res, 'Failed to fetch subscribers', 500);
  }
});

// DELETE /api/newsletter/:id - Admin delete subscriber
router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return sendError(res, 'Subscriber not found', 404);
    }
    return sendSuccess(res, null, 'Subscriber deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete subscriber', 500);
  }
});

export default router;
