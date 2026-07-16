import express from 'express';
import Product from '../models/Product.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { cacheMiddleware, clearCache } from '../middlewares/cache.js';

const router = express.Router();

router.get('/', cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const category = req.query.category;
    const sort = req.query.sort || '-createdAt';

    const filter = { isActive: true };
    if (search) filter.$text = { $search: search };
    if (category) filter.categoryId = category;

    const products = await Product.find(filter).sort(sort).skip(skip).limit(limit).populate('categoryId');
    const total = await Product.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    return sendSuccess(res, { products, page, pages, total }, 'Products fetched', 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to fetch products', 500);
  }
});

router.get('/:slug', cacheMiddleware(300), async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('categoryId');
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    return sendSuccess(res, product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product', 500);
  }
});

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { name, slug, description, categoryId, price, stock } = req.body;
    if (!name || !slug || !categoryId || !price || stock === undefined) {
      return sendError(res, 'Missing required fields', 400);
    }

    const product = new Product({ ...req.body, slug: slug.toLowerCase() });
    await product.save();
    clearCache('/api/products');

    return sendSuccess(res, product, 'Product created', 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to create product', 500);
  }
});

router.patch('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    clearCache('/api/products');
    return sendSuccess(res, product, 'Product updated');
  } catch (error) {
    return sendError(res, 'Failed to update product', 500);
  }
});

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    clearCache('/api/products');
    return sendSuccess(res, null, 'Product deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete product', 500);
  }
});

export default router;
