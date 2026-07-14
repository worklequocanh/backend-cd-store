import express from 'express';
import Category from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    return sendSuccess(res, categories);
  } catch (error) {
    return sendError(res, 'Failed to fetch categories', 500);
  }
});

router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { name, slug, description, image } = req.body;
    if (!name || !slug) {
      return sendError(res, 'Name and slug are required', 400);
    }

    const category = new Category({ name, slug: slug.toLowerCase(), description, image });
    await category.save();

    return sendSuccess(res, category, 'Category created', 201);
  } catch (error) {
    return sendError(res, 'Failed to create category', 500);
  }
});

router.patch('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { name, slug, description, image, isActive } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { name, slug: slug?.toLowerCase(), description, image, isActive }, { new: true });

    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    return sendSuccess(res, category, 'Category updated');
  } catch (error) {
    return sendError(res, 'Failed to update category', 500);
  }
});

router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }
    return sendSuccess(res, null, 'Category deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete category', 500);
  }
});

export default router;
