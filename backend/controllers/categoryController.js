import asyncHandler from 'express-async-handler';
import Category from '../models/Category.js';
import Expense from '../models/Transaction.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const categorySchema = z.object({
    name: z.string().min(1, 'O nome da categoria é obrigatório.'),
    color: z.string().optional(),
});

const getCategories = asyncHandler(async (req, res) => {
  logger.logEvent('INFO', `User ${req.user._id} fetching categories.`);
  const categories = await Category.find({ user: req.user._id });
  logger.logEvent('INFO', `Found ${categories.length} categories for user ${req.user._id}.`);
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, color } = categorySchema.parse(req.body);

  logger.logEvent('INFO', `User ${req.user._id} creating category with name "${name}".`);
  const category = new Category({
    user: req.user._id,
    name,
    color,
  });

  const createdCategory = await category.save();
  logger.logEvent('INFO', `Category "${name}" created successfully with ID ${createdCategory._id} for user ${req.user._id}.`);
  res.status(201).json(createdCategory);
});

const updateCategory = asyncHandler(async (req, res) => {
    const { name, color } = categorySchema.parse(req.body);
    const categoryId = req.params.id;

    logger.logEvent('INFO', `User ${req.user._id} attempting to update category ${categoryId}.`);
    const category = await Category.findById(categoryId);

    if (category && category.user.toString() === req.user._id.toString()) {
        category.name = name || category.name;
        category.color = color || category.color;

        const updatedCategory = await category.save();
        logger.logEvent('INFO', `Category ${categoryId} updated successfully for user ${req.user._id}.`);
        res.json(updatedCategory);
    } else {
        logger.logEvent('INFO', `Update failed: Category ${categoryId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Categoria não encontrada.');
    }
});

const deleteCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    logger.logEvent('INFO', `User ${req.user._id} attempting to delete category ${categoryId}.`);
    const category = await Category.findById(categoryId);

    if (category && category.user.toString() === req.user._id.toString()) {
        // Deletar todas as despesas associadas a esta categoria
        await Expense.deleteMany({ category: categoryId });
        logger.logEvent('INFO', `Deleted all expenses associated with category ${categoryId}.`);

        // Deletar a categoria
        await category.deleteOne();
        logger.logEvent('INFO', `Category ${categoryId} deleted successfully for user ${req.user._id}.`);
        res.json({ message: 'Categoria e despesas associadas foram removidas.' });
    } else {
        logger.logEvent('INFO', `Delete failed: Category ${categoryId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Categoria não encontrada.');
    }
});


export { getCategories, createCategory, updateCategory, deleteCategory };
