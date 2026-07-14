import express from 'express';
import Cart from '../models/Cart.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken } from '../middlewares/auth.js';

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
  cart.total = subtotal - (cart.discountAmount || 0);
};

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
