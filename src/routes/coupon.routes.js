import express from 'express';
import Coupon from '../models/Coupon.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true, expiredAt: { $gt: new Date() } });
    return sendSuccess(res, coupons);
  } catch (error) {
    return sendError(res, 'Failed to fetch coupons', 500);
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, expiredAt: { $gt: new Date() } });

    if (!coupon) {
      return sendError(res, 'Invalid or expired coupon', 400);
    }

    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      return sendError(res, `Minimum order value is ${coupon.minOrderValue}`, 400);
    }

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return sendError(res, 'Coupon usage limit reached', 400);
    }

    const discount = coupon.type === 'percent' ? (orderValue * coupon.value) / 100 : coupon.value;
    const finalDiscount = coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;

    return sendSuccess(res, { coupon, discount: finalDiscount }, 'Coupon is valid');
  } catch (error) {
    return sendError(res, 'Failed to validate coupon', 500);
  }
});

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { code, type, value, minOrderValue, maxDiscount, maxUsage, startDate, expiredAt } = req.body;

    if (!code || !type || !value) {
      return sendError(res, 'Missing required fields', 400);
    }

    const coupon = new Coupon({ code: code.toUpperCase(), type, value, minOrderValue, maxDiscount, maxUsage, startDate, expiredAt });
    await coupon.save();

    return sendSuccess(res, coupon, 'Coupon created', 201);
  } catch (error) {
    return sendError(res, 'Failed to create coupon', 500);
  }
});

router.patch('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    return sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) {
    return sendError(res, 'Failed to update coupon', 500);
  }
});

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    return sendSuccess(res, null, 'Coupon deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete coupon', 500);
  }
});

export default router;
