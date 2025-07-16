import express from 'express';
const router = express.Router();
import { getDashboardSummary, getCategoryBreakdown } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.get('/summary/:year/:month', protect, getDashboardSummary);
router.post('/category-breakdown', protect, getCategoryBreakdown); // Nova rota para o gráfico de pizza

export default router;