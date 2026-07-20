import express from 'express';
import Coupon from '../models/Coupon.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { cacheMiddleware, clearCache } from '../middlewares/cache.js';
import { validateCoupon } from '../services/coupon.service.js';

const router = express.Router();

// GET /api/coupons/admin - Admin fetch all coupons
router.get('/admin', verifyToken, verifyRole(['admin']), cacheMiddleware(300), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, coupons);
  } catch (error) {
    return sendError(res, 'Failed to fetch coupons', 500);
  }
});

// GET /api/coupons - Client fetch active available coupons
router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const { all, admin } = req.query;
    if (all === 'true' || admin === 'true') {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      return sendSuccess(res, coupons);
    }
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { isUnlimitedTime: true },
        { expiredAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });
    return sendSuccess(res, coupons);
  } catch (error) {
    return sendError(res, 'Failed to fetch coupons', 500);
  }
});

// POST /api/coupons/validate - Validate coupon eligibility
router.post('/validate', async (req, res) => {
  try {
    const { code, orderValue = 0, userId, email } = req.body;
    
    // Check validation rules using unified service
    const result = await validateCoupon({
      code,
      userId: userId || (req.user ? req.user.id : null),
      userEmail: email || (req.user ? req.user.email : null),
      orderValue,
      checkUserLimits: true
    });

    if (!result.success) {
      return sendError(res, result.message, 400, { errorCode: result.code });
    }

    return sendSuccess(res, {
      coupon: result.coupon,
      discount: result.discountAmount
    }, 'Mã giảm giá hợp lệ');
  } catch (error) {
    console.error('Error validating coupon:', error);
    return sendError(res, 'Failed to validate coupon', 500);
  }
});

// POST /api/coupons - Admin create new coupon
router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const {
      code, type, value, minOrderValue, maxDiscount, maxUsage,
      usagePerUserLimit, requiresNewsletter, allowedEmails,
      isUnlimitedTime, startDate, expiredAt, description
    } = req.body;

    if (!code || !type || value === undefined || value === null) {
      return sendError(res, 'Vui lòng điền đầy đủ Mã, Loại giảm giá và Giá trị giảm', 400);
    }

    if (!isUnlimitedTime && !expiredAt) {
      return sendError(res, 'Vui lòng chọn ngày hết hạn hoặc tích chọn Không giới hạn thời gian (vĩnh viễn)', 400);
    }

    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      maxUsage: maxUsage && Number(maxUsage) > 0 ? Number(maxUsage) : null,
      usagePerUserLimit: usagePerUserLimit !== undefined ? Number(usagePerUserLimit) : 1,
      requiresNewsletter: !!requiresNewsletter,
      allowedEmails: Array.isArray(allowedEmails) ? allowedEmails : [],
      isUnlimitedTime: !!isUnlimitedTime,
      startDate: startDate || new Date(),
      expiredAt: isUnlimitedTime ? null : expiredAt,
      description
    });

    await coupon.save();
    clearCache('/api/coupons');

    return sendSuccess(res, coupon, 'Đã tạo mã giảm giá mới!', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Mã giảm giá này đã tồn tại trong hệ thống', 400);
    }
    console.error('Error creating coupon:', error);
    return sendError(res, 'Tạo mã giảm giá thất bại', 500);
  }
});

// PATCH /api/coupons/:id - Admin update coupon
router.patch('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    if (updates.isUnlimitedTime === true) {
      updates.expiredAt = null;
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!coupon) {
      return sendError(res, 'Không tìm thấy mã giảm giá', 404);
    }
    clearCache('/api/coupons');
    return sendSuccess(res, coupon, 'Đã cập nhật mã giảm giá');
  } catch (error) {
    console.error('Error updating coupon:', error);
    return sendError(res, 'Cập nhật mã giảm giá thất bại', 500);
  }
});

// DELETE /api/coupons/:id - Admin delete coupon
router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return sendError(res, 'Không tìm thấy mã giảm giá', 404);
    }
    clearCache('/api/coupons');
    return sendSuccess(res, null, 'Đã xóa mã giảm giá');
  } catch (error) {
    return sendError(res, 'Xóa mã giảm giá thất bại', 500);
  }
});

export default router;
