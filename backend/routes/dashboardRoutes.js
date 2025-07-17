import express from 'express';
const router = express.Router();
import { getDashboardSummary, getCategoryBreakdown, getDashboardForecast } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.get('/summary/:year/:month', protect, getDashboardSummary);
router.post('/category-breakdown', protect, getCategoryBreakdown);
router.get('/forecast/:year/:month', protect, getDashboardForecast);

export default router;