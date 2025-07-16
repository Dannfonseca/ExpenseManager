import logger from '../utils/logger.js';

const protectJob = (req, res, next) => {
  const secret = req.headers['x-cron-secret'];
  
  if (!secret || secret !== process.env.CRON_JOB_SECRET) {
    logger.logEvent('ERROR', 'Tentativa de acesso não autorizado ao endpoint de job.');
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  next();
};

export { protectJob };