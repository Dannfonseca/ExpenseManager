import express from 'express';
const router = express.Router();
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.route('/').get(protect, getCategories).post(protect, createCategory);
router.route('/:id').put(protect, updateCategory).delete(protect, deleteCategory);

export default router;