import express from 'express';
const router = express.Router();
import {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  createBulkTransactions
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

// Nova rota para criação em massa
router.route('/bulk').post(protect, createBulkTransactions);

router.route('/:id')
  .get(protect, getTransactionById)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

export default router;