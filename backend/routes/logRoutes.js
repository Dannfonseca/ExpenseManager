import express from 'express';
const router = express.Router();
import { getLogs } from '../controllers/logController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

router.route('/').get(protect, admin, getLogs);

export default router;