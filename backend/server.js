/*
 * Alterada a lógica de verificação de ambiente para ser mais robusta.
 * - O servidor agora serve os arquivos do frontend por padrão.
 * - A mensagem "API em modo de desenvolvimento" só aparecerá se NODE_ENV
 * for explicitamente definido como 'development', corrigindo o problema no deploy.
 * - Adicionada rota para transações recorrentes.
 */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import User from './models/User.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import recurringTransactionRoutes from './routes/recurringTransactionRoutes.js'; // Importa a nova rota
import dashboardRoutes from './routes/dashboardRoutes.js';
import logRoutes from './routes/logRoutes.js';

dotenv.config();

const app = express();

const startServer = async () => {
  await connectDB();

  // Script para atribuir role de admin (pode ser removido após a primeira execução bem-sucedida)
  const assignAdminRole = async () => {
    try {
      const adminEmail = 'russelmytho@gmail.com';
      const adminUser = await User.findOne({ email: adminEmail });

      if (adminUser && adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log(`Usuário ${adminEmail} foi definido como administrador.`);
      }
    } catch (error) {
      console.error('Erro ao tentar definir o administrador:', error);
    }
  };
  await assignAdminRole();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => res.status(200).send('OK'));

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/recurring-transactions', recurringTransactionRoutes);
  app.use('/api/jobs', jobRoutes); // Usa a nova rota
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/logs', logRoutes);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // --- Lógica para servir o frontend ---
  // Se não estivermos explicitamente em desenvolvimento, sirva o build de produção.
  if (process.env.NODE_ENV !== 'development') {
    const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendDistPath));

    // Para qualquer outra rota, sirva o index.html do frontend
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
  } else {
    // Apenas em desenvolvimento, mostre a mensagem da API.
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