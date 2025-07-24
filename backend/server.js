import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import User from './models/User.js';
import passport from 'passport';
import session from 'express-session';
import configurePassport from './config/passport.js';
import logger from './utils/logger.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import recurringTransactionRoutes from './routes/recurringTransactionRoutes.js';
import paymentTypeRoutes from './routes/paymentTypeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import logRoutes from './routes/logRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

dotenv.config();

const app = express();
configurePassport();

const startServer = async () => {
  await connectDB();

  // Script aprimorado para garantir o status de administrador
  const assignAdminRole = async () => {
    try {
      const adminEmail = 'russelmytho@gmail.com';
      const adminUser = await User.findOne({ email: adminEmail });

      if (adminUser) {
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          await adminUser.save();
          logger.logEvent('INFO', `[ADMIN SCRIPT] Usuário ${adminEmail} foi DEFINIDO como administrador.`);
        } else {
          logger.logEvent('INFO', `[ADMIN SCRIPT] Usuário ${adminEmail} já é um administrador. Nenhuma ação necessária.`);
        }
      } else {
        logger.logEvent('WARN', `[ADMIN SCRIPT] Usuário administrador ${adminEmail} não encontrado no banco de dados.`);
      }
    } catch (error) {
      console.error('[ADMIN SCRIPT] Erro ao tentar definir o administrador:', error);
    }
  };
  await assignAdminRole();

  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/health', (req, res) => res.status(200).send('OK'));

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/payment-types', paymentTypeRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/recurring-transactions', recurringTransactionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/jobs', jobRoutes);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  if (process.env.NODE_ENV !== 'development') {
    const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendDistPath));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.send('API está rodando em modo de desenvolvimento...');
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, console.log(`Servidor rodando no modo ${process.env.NODE_ENV || 'production'} na porta ${PORT}`));
};

startServer().catch(err => {
    console.error("Failed to start server:", err);
});