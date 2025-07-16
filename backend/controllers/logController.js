import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';

// @desc    Obtém os logs armazenados
// @route   GET /api/logs
// @access  Private
const getLogs = asyncHandler(async (req, res) => {
  // O log desta ação foi removido para não poluir a visualização de logs.
  res.json(logger.getLogs());
});

export { getLogs };