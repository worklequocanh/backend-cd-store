import express from 'express';
import Cart from '../models/Cart.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken } from '../middlewares/auth.js';
import Coupon from '../models/Coupon.js';

const router = express.Router();
import mongoose from 'mongoose';

const calculateTotals = async (cart) => {
  let subtotal = 0;
  const Product = mongoose.model('Product');
  const validItems = [];

  for (let item of cart.items) {
    if (!item.productId) continue;
    
    const id = typeof item.productId === 'object' && item.productId._id ? item.productId._id : item.productId;
    const prod = await Product.findById(id);
    
    if (prod) {
      const price = prod.discountPrice || prod.price || 0;
      item.price = price;
      subtotal += price * item.quantity;
      validItems.push(item);
    }
  }
  
  cart.items = validItems;
  cart.subtotal = subtotal;

  if (cart.couponCode) {
    const CouponModel = mongoose.model('Coupon');
    const coupon = await CouponModel.findOne({ code: cart.couponCode, isActive: true, expiredAt: { $gt: new Date() } });
    if (!coupon || (coupon.minOrderValue && subtotal < coupon.minOrderValue)) {
      cart.couponCode = null;
      cart.discountAmount = 0;
    } else {
      const discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
      const finalDiscount = coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
      cart.discountAmount = finalDiscount;
    }
  } else {
    cart.discountAmount = 0;
  }

  cart.total = Math.max(0, subtotal - (cart.discountAmount || 0));
};

router.post(['/coupon', '/apply-coupon'], verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return sendError(res, 'Coupon code is required', 400);

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return sendError(res, 'Your cart is empty', 400);
    }

    const CouponModel = mongoose.model('Coupon');
    const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isActive: true, expiredAt: { $gt: new Date() } });

    if (!coupon) {
      return sendError(res, 'Invalid or expired coupon code', 400);
    }

    if (coupon.minOrderValue && cart.subtotal < coupon.minOrderValue) {
      return sendError(res, `Minimum order value for this coupon is $${coupon.minOrderValue}`, 400);
    }

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
      return sendError(res, 'Coupon usage limit has been reached', 400);
    }

    cart.couponCode = coupon.code;
    await calculateTotals(cart);
    await cart.save();

    return sendSuccess(res, cart, `Coupon applied! Discount: $${cart.discountAmount}`);
  } catch (error) {
    return sendError(res, 'Failed to apply coupon', 500);
  }
});

router.put('/coupon', verifyToken, async (req, res) => {
  req.url = '/coupon';
  return router.handle(req, res);
});

router.delete('/coupon', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) return sendError(res, 'Cart not found', 404);

    cart.couponCode = null;
    cart.discountAmount = 0;
    await calculateTotals(cart);
    await cart.save();

    return sendSuccess(res, cart, 'Coupon removed');
  } catch (error) {
    return sendError(res, 'Failed to remove coupon', 500);
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) {
      return sendSuccess(res, { items: [], subtotal: 0, total: 0 });
    }
    
    // Calculate subtotal on the fly since price might be missing from items
    await calculateTotals(cart);
    await cart.save();

    return sendSuccess(res, cart);
  } catch (error) {
    return sendError(res, 'Failed to fetch cart', 500);
  }
});

router.post('/items', verifyToken, async (req, res) => {
  try {
    const { productId, quantity, variant } = req.body;
    if (!productId || !quantity) {
      return sendError(res, 'Product ID and quantity are required', 400);
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId && item.variant === variant);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, variant });
    }

    await cart.save();
    await cart.populate('items.productId');
    await calculateTotals(cart);
    await cart.save();

    return sendSuccess(res, cart, 'Item added to cart', 201);
  } catch (error) {
    return sendError(res, 'Failed to add item to cart', 500);
  }
});

router.patch('/items/:itemId', verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return sendError(res, 'Cart not found', 404);
    }

    const item = cart.items.find((item) => item._id.toString() === req.params.itemId);
    if (!item) {
      return sendError(res, 'Item not found in cart', 404);
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.productId');
    await calculateTotals(cart);
    await cart.save();

    return sendSuccess(res, cart, 'Cart updated');
  } catch (error) {
    return sendError(res, 'Failed to update cart', 500);
  }
});

router.delete('/items/:itemId', verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return sendError(res, 'Cart not found', 404);
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.productId');
    await calculateTotals(cart);
    await cart.save();

    return sendSuccess(res, cart, 'Item removed from cart');
  } catch (error) {
    return sendError(res, 'Failed to remove item from cart', 500);
  }
});

export default router;
