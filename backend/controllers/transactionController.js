import asyncHandler from 'express-async-handler';
import RecurringTransaction from '../models/RecurringTransaction.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import { add, sub } from 'date-fns';
import mongoose from 'mongoose';

const calculateNextOccurrence = (startDate, frequency) => {
  const now = new Date();
  let nextDate = new Date(startDate);

  while (nextDate < now) {
    switch (frequency) {
      case 'daily':
        nextDate = add(nextDate, { days: 1 });
        break;
      case 'weekly':
        nextDate = add(nextDate, { weeks: 1 });
        break;
      case 'monthly':
        nextDate = add(nextDate, { months: 1 });
        break;
      case 'yearly':
        nextDate = add(nextDate, { years: 1 });
        break;
    }
  }
  return nextDate;
};


const recurringTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    description: z.string().min(1, 'A descrição é obrigatória.'),
    amount: z.coerce.number().positive('O valor deve ser positivo.'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Data de início inválida.' }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Data final inválida.' }).optional().or(z.literal('')),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria inválido.').optional().or(z.literal('')),
    paymentType: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de tipo de pagamento inválido.').optional().or(z.literal('')),
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


// @desc    Lista todas as transações recorrentes
// @route   GET /api/recurring-transactions
// @access  Private
const getRecurringTransactions = asyncHandler(async (req, res) => {
  logger.logEvent('INFO', `User ${req.user._id} fetching recurring transactions with query: ${JSON.stringify(req.query)}.`);
  
  const { category, search, month, year, type, paymentType } = req.query;
  const filter = { user: req.user._id };

  if (category && category !== 'all') filter.category = new mongoose.Types.ObjectId(category);
  if (paymentType && paymentType !== 'all') filter.paymentType = new mongoose.Types.ObjectId(paymentType);
  if (type && type !== 'all') filter.type = type;
  if (search) filter.description = { $regex: search, $options: 'i' };

  let recurringTransactions = await RecurringTransaction.find(filter)
    .populate('category', 'name color')
    .populate('paymentType', 'name')
    .sort({ nextOccurrenceDate: 1 });

  if (year && month) {
    const numYear = parseInt(year);
    const numMonth = parseInt(month) - 1;
    
    recurringTransactions = recurringTransactions.filter(tx => {
        const nextDate = new Date(tx.nextOccurrenceDate);
        return nextDate.getUTCFullYear() === numYear && nextDate.getUTCMonth() === numMonth;
    });
  }
      
  res.json(recurringTransactions);
});

// @desc    Cria uma nova transação recorrente
// @route   POST /api/recurring-transactions
// @access  Private
const createRecurringTransaction = asyncHandler(async (req, res) => {
  const parsedBody = recurringTransactionSchema.parse(req.body);
  const { type, description, amount, startDate, endDate, frequency, category, paymentType, notes } = parsedBody;

  logger.logEvent('INFO', `User ${req.user._id} creating recurring ${type}: "${description}".`);
  
  const nextOccurrenceDate = calculateNextOccurrence(new Date(startDate), frequency);

  const recurringTransaction = new RecurringTransaction({
    user: req.user._id,
    type,
    description,
    amount,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    frequency,
    category: type === 'expense' ? category : null,
    paymentType: paymentType || null,
    notes,
    nextOccurrenceDate
  });

  const createdRecurringTransaction = await recurringTransaction.save();
  logger.logEvent('INFO', `Recurring transaction "${description}" created with ID ${createdRecurringTransaction._id}.`);
  res.status(201).json(createdRecurringTransaction);
});

// @desc    Atualiza uma transação recorrente
// @route   PUT /api/recurring-transactions/:id
// @access  Private
const updateRecurringTransaction = asyncHandler(async (req, res) => {
  const parsedBody = recurringTransactionSchema.parse(req.body);
  const { type, description, amount, startDate, endDate, frequency, category, paymentType, notes } = parsedBody;
  const transactionId = req.params.id;
  
  const recurringTransaction = await RecurringTransaction.findById(transactionId);

  if (recurringTransaction && recurringTransaction.user.toString() === req.user._id.toString()) {
      recurringTransaction.type = type;
      recurringTransaction.description = description;
      recurringTransaction.amount = amount;
      recurringTransaction.startDate = new Date(startDate);
      recurringTransaction.endDate = endDate ? new Date(endDate) : null;
      recurringTransaction.frequency = frequency;
      recurringTransaction.category = type === 'expense' ? category : null;
      recurringTransaction.paymentType = paymentType || recurringTransaction.paymentType;
      recurringTransaction.notes = notes;
      recurringTransaction.nextOccurrenceDate = calculateNextOccurrence(new Date(startDate), frequency);

      const updatedTransaction = await recurringTransaction.save();
      logger.logEvent('INFO', `Recurring transaction ${transactionId} updated for user ${req.user._id}.`);
      res.json(updatedTransaction);
  } else {
      res.status(404);
      throw new Error('Transação recorrente não encontrada');
  }
});

// @desc    Deleta uma transação recorrente
// @route   DELETE /api/recurring-transactions/:id
// @access  Private
const deleteRecurringTransaction = asyncHandler(async (req, res) => {
    const transactionId = req.params.id;
    const transaction = await RecurringTransaction.findById(transactionId);

    if (transaction && transaction.user.toString() === req.user._id.toString()) {
        await transaction.deleteOne();
        logger.logEvent('INFO', `Recurring transaction ${transactionId} deleted by user ${req.user._id}.`);
        res.json({ message: 'Transação recorrente removida.' });
    } else {
        res.status(404);
        throw new Error('Transação recorrente não encontrada');
    }
});


export { getRecurringTransactions, createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction };