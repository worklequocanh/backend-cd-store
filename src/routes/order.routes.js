import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken } from '../middlewares/auth.js';
import { sendEmail } from '../utils/email.js';
import { getOrderStatusEmail } from '../utils/emailTemplates.js';
import { getPayOS } from '../config/payos.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return sendError(res, 'Cart is empty', 400);
    }

    if (!shippingAddress || !paymentMethod) {
      return sendError(res, 'Shipping address and payment method are required', 400);
    }

    let subtotal = 0;
    const items = cart.items.map((item) => {
      const price = item.productId.discountPrice || item.productId.price;
      subtotal += price * item.quantity;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        price,
        quantity: item.quantity,
        variant: item.variant,
      };
    });

    const shippingFee = subtotal > 500000 ? 0 : 250;
    const total = subtotal + shippingFee - (cart.discountAmount || 0);

    const order = new Order({
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      subtotal,
      shippingFee,
      discountAmount: cart.discountAmount || 0,
      total,
    });

    await order.save();

    cart.items = [];
    cart.couponCode = null;
    cart.discountAmount = 0;
    await cart.save();

    // Send confirmation email asynchronously (don't await it to block response)
    User.findById(req.user.id).then(user => {
      if (user && user.email) {
        sendEmail({
          to: user.email,
          subject: `Order Status Update - #${order.orderNumber}`,
          html: getOrderStatusEmail(order, user)
        });
      }
    }).catch(err => console.error('Failed to get user for email:', err));

    return sendSuccess(res, order, 'Order created', 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to create order', 500);
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Order.countDocuments({ userId: req.user.id });
    const pages = Math.ceil(total / limit);

    return sendSuccess(res, { orders, page, pages, total });
  } catch (error) {
    return sendError(res, 'Failed to fetch orders', 500);
  }
});

router.get('/config/payment', verifyToken, (req, res) => {
  return sendSuccess(res, {
    bankId: process.env.BANK_ID,
    accountNo: process.env.ACCOUNT_NO,
    accountName: process.env.ACCOUNT_NAME,
  });
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');

    if (!order || (order.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return sendError(res, 'Order not found or access denied', 404);
    }

    // Proactively check PayOS status if still pending
    if (order.paymentMethod === 'qr' && order.paymentStatus === 'pending' && order.payosOrderCode) {
      try {
        const payos = getPayOS();
        const paymentInfo = await payos.getPaymentLinkInformation(order.payosOrderCode);
        if (paymentInfo && paymentInfo.status === 'PAID') {
          order.paymentStatus = 'completed';
          order.orderStatus = 'confirmed';
          await order.save();
        }
      } catch (err) {
        console.error('Failed to sync PayOS status:', err.message);
      }
    }

    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, 'Failed to fetch order', 500);
  }
});

router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    order.orderStatus = status;
    await order.save();

    const user = await User.findById(order.userId);
    if (user && user.email) {
      sendEmail({
        to: user.email,
        subject: `Update on your Order #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Order Status Updated</h2>
            <p>Hi ${user.name},</p>
            <p>Your order <strong>#${order.orderNumber}</strong> has been updated to: <strong style="text-transform: uppercase;">${status}</strong>.</p>
            <p>Thank you for shopping with CD Store!</p>
          </div>
        `
      });
    }

    return sendSuccess(res, order, 'Order status updated');
  } catch (error) {
    return sendError(res, 'Failed to update order status', 500);
  }
});

router.post('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order || order.userId.toString() !== req.user.id) {
      return sendError(res, 'Order not found or access denied', 404);
    }

    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return sendError(res, 'Cannot cancel this order', 400);
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    return sendSuccess(res, order, 'Order cancelled');
  } catch (error) {
    return sendError(res, 'Failed to cancel order', 500);
  }
});

router.post('/:id/restore-cart', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || order.userId.toString() !== req.user.id) {
      return sendError(res, 'Order not found or access denied', 404);
    }

    if (order.paymentStatus !== 'pending') {
      return sendError(res, 'Only pending orders can be restored to cart', 400);
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Restore items to cart
    order.items.forEach(orderItem => {
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === orderItem.productId.toString() && item.variant === orderItem.variant
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += orderItem.quantity;
      } else {
        cart.items.push({
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          variant: orderItem.variant
        });
      }
    });

    await cart.save();
    
    // Delete the pending order since user cancelled payment
    await Order.findByIdAndDelete(order._id);

    return sendSuccess(res, null, 'Cart restored successfully');
  } catch (error) {
    console.error('Failed to restore cart:', error);
    return sendError(res, 'Failed to restore cart', 500);
  }
});

router.post('/:id/mock-pay', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order || order.userId.toString() !== req.user.id) {
      return sendError(res, 'Order not found or access denied', 404);
    }

    if (order.paymentStatus === 'completed') {
      return sendError(res, 'Order is already paid', 400);
    }

    order.paymentStatus = 'completed';
    order.orderStatus = 'confirmed';
    await order.save();

    return sendSuccess(res, order, 'Payment successful (Mock)');
  } catch (error) {
    return sendError(res, 'Failed to process mock payment', 500);
  }
});

router.post('/:id/create-payos-link', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order || order.userId.toString() !== req.user.id) {
      return sendError(res, 'Order not found', 404);
    }
    if (order.paymentStatus !== 'pending') {
      return sendError(res, 'Order is already paid or cancelled', 400);
    }

    if (order.payosCheckoutUrl) {
      return sendSuccess(res, { checkoutUrl: order.payosCheckoutUrl }, 'Payment link retrieved');
    }

    if (!order.payosOrderCode) {
      order.payosOrderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
      await order.save();
    }

    const payos = getPayOS();
    const clientUrl = req.headers.origin || process.env.FRONTEND_URL || 'https://frontend-cd-store.vercel.app';
    const body = {
      orderCode: order.payosOrderCode,
      amount: Math.round(order.total),
      description: `Thanh toan don ${order.orderNumber}`.substring(0, 25),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(item.price)
      })),
      returnUrl: `${clientUrl}/orders/${order._id}?payos=success`,
      cancelUrl: `${clientUrl}/orders/${order._id}?payos=cancel`
    };

    const paymentLinkRes = await payos.createPaymentLink(body);
    order.payosCheckoutUrl = paymentLinkRes.checkoutUrl;
    await order.save();
    
    return sendSuccess(res, { checkoutUrl: paymentLinkRes.checkoutUrl }, 'Payment link created');
  } catch (error) {
    console.error('PayOS Link Error:', error);
    return sendError(res, error.message || 'Failed to create payment link', 500);
  }
});

router.post('/payos/webhook', async (req, res) => {
  try {
    const payos = getPayOS();
    const webhookData = payos.verifyPaymentWebhookData(req.body);

    if (webhookData.code === '00' && webhookData.success) {
      const order = await Order.findOne({ payosOrderCode: webhookData.data.orderCode });
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        await order.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Webhook received successfully'
    });
  } catch (error) {
    console.error('PayOS Webhook Error:', error);
    res.json({
      success: false,
      message: 'Webhook error'
    });
  }
});

export default router;
