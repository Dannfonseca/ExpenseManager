import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';


const getLogs = asyncHandler(async (req, res) => { 
  res.json(logger.getLogs());
});

export { getLogs };