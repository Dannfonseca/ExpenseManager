import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limita cada IP a 10 requisições de registro por janela
  standardHeaders: true, 
  legacyHeaders: false, 
  handler: (req, res, next, options) => {
    logger.logEvent('WARN', `Rate limit excedido para o IP: ${req.ip} na rota: ${req.originalUrl}`);
    res.status(options.statusCode).json({ message: 'Muitas tentativas de registro a partir deste IP. Por favor, tente novamente após uma hora.' });
  },
});

export { registerLimiter };