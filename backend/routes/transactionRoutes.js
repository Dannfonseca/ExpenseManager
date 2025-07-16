import express from 'express';
const router = express.Router();
import {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

router.route('/:id')
  .get(protect, getTransactionById)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

export default router;