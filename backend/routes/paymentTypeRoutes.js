import express from 'express';
const router = express.Router();
import {
  getPaymentTypes,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
} from '../controllers/paymentTypeController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.route('/').get(protect, getPaymentTypes).post(protect, createPaymentType);
router.route('/:id').put(protect, updatePaymentType).delete(protect, deletePaymentType);

export default router;