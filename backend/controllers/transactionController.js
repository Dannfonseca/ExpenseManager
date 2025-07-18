/*
 * Corrigido o schema de validação para a rota de ATUALIZAÇÃO.
 * - Aplicada a mesma lógica .superRefine() para a função 'updateTransaction',
 * garantindo que a categoria seja validada apenas para despesas.
 * Adicionados filtros por data e tipo na busca de transações.
 * Refatorada a lógica de busca para garantir a consistência dos dados.
 * - Corrigidas as chamadas de logger para usar o novo método logEvent.
 * Adicionado suporte para 'paymentType' (tipo de pagamento).
 * Corrigida a lógica de filtragem para aplicar todos os filtros no banco de dados, convertendo IDs para ObjectId.
 * Adicionada a função createBulkTransactions para inserção em massa.
 */
import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';


const transactionSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    description: z.string().min(1, 'A descrição é obrigatória.'),
    amount: z.coerce.number().positive('O valor deve ser positivo.'),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Data inválida.' }),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria inválido.')
      .optional()
      .or(z.literal('')),
    paymentType: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'ID de tipo de pagamento inválido.')
      .optional()
      .or(z.literal('')),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'expense' && !data.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'A categoria é obrigatória para despesas.',
      });
    }
  });

const bulkTransactionSchema = z.array(transactionSchema);


// @desc    Lista todas as transações do usuário com filtros
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
    const { category, search, month, year, type, paymentType } = req.query;
    const userId = req.user._id;

    logger.logEvent('INFO', `User ${userId} fetching transactions with query: ${JSON.stringify(req.query)}`);

    const monthFilter = { user: userId };
    if (year && month) {
      const numYear = parseInt(year);
      const numMonth = parseInt(month) - 1;
      const startDate = new Date(Date.UTC(numYear, numMonth, 1));
      const endDate = new Date(Date.UTC(numYear, numMonth + 1, 1));
      monthFilter.date = { $gte: startDate, $lt: endDate };
    }

    const listFilter = { ...monthFilter };

    if (category && category !== 'all') {
      listFilter.category = new mongoose.Types.ObjectId(category);
    }
    if (paymentType && paymentType !== 'all') {
      listFilter.paymentType = new mongoose.Types.ObjectId(paymentType);
    }
    if (type && type !== 'all') {
      listFilter.type = type;
    }
    if (search) {
      listFilter.description = { $regex: search, $options: 'i' };
    }

    const transactions = await Transaction.find(listFilter)
      .populate('category', 'name color')
      .populate('paymentType', 'name')
      .sort({ date: -1 });
    
    const allMonthTransactions = await Transaction.find(monthFilter);
    
    const monthIncome = allMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpenses = allMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  
    logger.logEvent('INFO', `Found ${transactions.length} transactions for user ${userId} after applying all filters.`);
  
    res.json({
      transactions,
      monthTotals: {
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses,
      },
    });
  });

// @desc    Cria uma nova transação
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const parsedBody = transactionSchema.parse(req.body);
  const { type, description, amount, date, category, paymentType, notes } = parsedBody;

  logger.logEvent('INFO', `User ${req.user._id} creating ${type} transaction: "${description}".`);
  
  const transaction = new Transaction({
    user: req.user._id,
    type,
    description,
    amount,
    date: new Date(date),
    category: type === 'expense' ? category : null,
    paymentType: paymentType || null,
    notes,
  });

  const createdTransaction = await transaction.save();
  logger.logEvent('INFO', `Transaction "${description}" created with ID ${createdTransaction._id} for user ${req.user._id}.`);
  res.status(201).json(createdTransaction);
});

// @desc    Cria múltiplas transações
// @route   POST /api/transactions/bulk
// @access  Private
const createBulkTransactions = asyncHandler(async (req, res) => {
  const parsedBody = bulkTransactionSchema.parse(req.body);
  const userId = req.user._id;

  logger.logEvent('INFO', `User ${userId} creating ${parsedBody.length} transactions in bulk.`);

  const transactionsToCreate = parsedBody.map(tx => ({
    ...tx,
    user: userId,
    date: new Date(tx.date),
    category: tx.type === 'expense' ? tx.category : null,
    paymentType: tx.paymentType || null,
  }));

  const createdTransactions = await Transaction.insertMany(transactionsToCreate);

  logger.logEvent('INFO', `${createdTransactions.length} transactions created successfully for user ${userId}.`);
  res.status(201).json(createdTransactions);
});

// @desc    Obtém uma transação específica
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
    const transactionId = req.params.id;
    logger.logEvent('INFO', `User ${req.user._id} fetching transaction with ID ${transactionId}.`);
    const transaction = await Transaction.findById(transactionId)
        .populate('category', 'name color')
        .populate('paymentType', 'name');

    if (transaction && transaction.user.toString() === req.user._id.toString()) {
        logger.logEvent('INFO', `Transaction ${transactionId} found for user ${req.user._id}.`);
        res.json(transaction);
    } else {
        logger.logEvent('INFO', `Fetch failed: Transaction ${transactionId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Transação não encontrada.');
    }
});

// @desc    Atualiza uma transação
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
    const parsedBody = transactionSchema.parse(req.body);
    const { type, description, amount, date, category, paymentType, notes } = parsedBody;
    const transactionId = req.params.id;
    
    logger.logEvent('INFO', `User ${req.user._id} attempting to update transaction ${transactionId}.`);
    const transaction = await Transaction.findById(transactionId);

    if (transaction && transaction.user.toString() === req.user._id.toString()) {
        transaction.type = type || transaction.type;
        transaction.description = description || transaction.description;
        transaction.amount = amount || transaction.amount;
        transaction.date = date ? new Date(date) : transaction.date;
        transaction.category = type === 'expense' ? category : null;
        transaction.paymentType = paymentType || transaction.paymentType;
        transaction.notes = notes || transaction.notes;
        
        const updatedTransaction = await transaction.save();
        logger.logEvent('INFO', `Transaction ${transactionId} updated successfully for user ${req.user._id}.`);
        res.json(updatedTransaction);

    } else {
        logger.logEvent('INFO', `Update failed: Transaction ${transactionId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Transação não encontrada');
    }
});


// @desc    Deleta uma transação
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
    const transactionId = req.params.id;
    logger.logEvent('INFO', `User ${req.user._id} attempting to delete transaction ${transactionId}.`);
    const transaction = await Transaction.findById(transactionId);

    if (transaction && transaction.user.toString() === req.user._id.toString()) {
        await transaction.deleteOne();
        logger.logEvent('INFO', `Transaction ${transactionId} deleted successfully for user ${req.user._id}.`);
        res.json({ message: 'Transação removida.' });
    } else {
        logger.logEvent('INFO', `Delete failed: Transaction ${transactionId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Transação não encontrada');
    }
});

export { getTransactions, createTransaction, getTransactionById, updateTransaction, deleteTransaction, createBulkTransactions };