import express from 'express';
import asyncHandler from 'express-async-handler';
import { processJobs } from '../jobs/processRecurringTransactions.js';
import { protectJob } from '../middlewares/jobAuthMiddleware.js';

const router = express.Router();

// @desc    Aciona o job de processamento de transações recorrentes
// @route   POST /api/jobs/trigger
// @access  Private (via Chave Secreta)
router.post('/trigger', protectJob, asyncHandler(async (req, res) => {
    try {
        const result = await processJobs();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao processar o job.', error: error.message });
    }
}));

export default router;