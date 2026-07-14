import express from 'express';
import Review from '../models/Review.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;
    if (!productId || !rating || !comment) {
      return sendError(res, 'Product ID, rating, and comment are required', 400);
    }

    const review = new Review({
      userId: req.user.id,
      productId,
      rating,
      comment,
      images: images || [],
    });

    await review.save();
    return sendSuccess(res, review, 'Review created', 201);
  } catch (error) {
    return sendError(res, 'Failed to create review', 500);
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ productId: req.params.productId, isApproved: true }).populate('userId', 'name avatar').skip(skip).limit(limit);
    const total = await Review.countDocuments({ productId: req.params.productId, isApproved: true });

    return sendSuccess(res, reviews);
  } catch (error) {
    return sendError(res, 'Failed to fetch reviews', 500);
  }
});

router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.userId.toString() !== req.user.id) {
      return sendError(res, 'Review not found or access denied', 404);
    }

    const { rating, comment, images } = req.body;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();
    return sendSuccess(res, review, 'Review updated');
  } catch (error) {
    return sendError(res, 'Failed to update review', 500);
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review || review.userId.toString() !== req.user.id) {
      return sendError(res, 'Review not found or access denied', 404);
    }

    await Review.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Review deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete review', 500);
  }
});

export default router;
