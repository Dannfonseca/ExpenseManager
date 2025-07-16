import express from 'express';
const router = express.Router();
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from '../controllers/recurringTransactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.route('/')
  .get(protect, getRecurringTransactions)
  .post(protect, createRecurringTransaction);

router.route('/:id')
  .put(protect, updateRecurringTransaction)
  .delete(protect, deleteRecurringTransaction);

export default router;