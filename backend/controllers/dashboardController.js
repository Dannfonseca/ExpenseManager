/*
 * Corrigido o erro de exportação e implementada a busca de dados para o gráfico de pizza.
 * - A função getCategoryBreakdown foi adicionada e exportada corretamente.
 * - Corrigidas as chamadas de logger para usar o novo método logEvent.
 */
import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const getDailyExpensesForMonth = async (userId, year, month) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const dailyExpensesData = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lt: endDate }, type: 'expense' } },
    { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } },
    { $sort: { '_id': 1 } },
  ]);

  const expensesMap = new Map(dailyExpensesData.map(d => [d._id, d.total]));
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    amount: expensesMap.get(i + 1) || 0
  }));
};

const getDashboardSummary = asyncHandler(async (req, res) => {
    const { year, month } = req.params;
    const { compareYear, compareMonth } = req.query;
    const userId = req.user._id;

    logger.logEvent('INFO', `User ${userId} fetching dashboard summary for ${month}/${year}.`);

    const numYear = parseInt(year);
    const numMonth = parseInt(month);

    const startDate = new Date(Date.UTC(numYear, numMonth - 1, 1));
    const endDate = new Date(Date.UTC(numYear, numMonth, 1));
    
    const matchUserAndDate = {
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate, $lt: endDate }
    };

    const totals = await Transaction.aggregate([
      { $match: matchUserAndDate },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const totalIncome = totals.find(t => t._id === 'income')?.total || 0;
    const totalExpenses = totals.find(t => t._id === 'expense')?.total || 0;
    const balance = totalIncome - totalExpenses;
    
    const dailyExpenses = await getDailyExpensesForMonth(userId, numYear, numMonth);
    
    let comparisonDailyExpenses = null;
    if (compareYear && compareMonth) {
      logger.logEvent('INFO', `Fetching comparison data for ${compareMonth}/${compareYear}`);
      comparisonDailyExpenses = await getDailyExpensesForMonth(userId, parseInt(compareYear), parseInt(compareMonth));
    }

    const topCategories = await Transaction.aggregate([
      { $match: { ...matchUserAndDate, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      { $project: { name: '$categoryInfo.name', total: '$total' } }
    ]);
  
    res.json({
        totalIncome,
        totalExpenses,
        balance,
        dailyExpenses,
        comparisonDailyExpenses,
        topCategories
    });
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { months } = req.body;
  const userId = req.user._id;

  if (!months || !Array.isArray(months) || months.length === 0) {
    res.status(400);
    throw new Error('Formato de requisição inválido. "months" deve ser um array não vazio.');
  }

  const breakdownData = {};

  for (const monthStr of months) {
    const [year, month] = monthStr.split('-');
    const startDate = new Date(Date.UTC(year, parseInt(month) - 1, 1));
    const endDate = new Date(Date.UTC(year, parseInt(month), 1));
    const matchUserAndDate = { user: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lt: endDate } };

    const expenses = await Transaction.aggregate([
        { $match: { ...matchUserAndDate, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: [ '$categoryInfo.name', 'Sem Categoria' ] }, total: '$total' } }
    ]);

    const incomes = await Transaction.aggregate([
      { $match: { ...matchUserAndDate, type: 'income' } },
      { $group: { _id: '$description', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $project: { name: '$_id', total: '$total' } }
    ]);
    
    breakdownData[monthStr] = { expenses, incomes };
  }
  
  logger.logEvent('INFO', `User ${userId} fetched category breakdown for months: ${months.join(', ')}.`);
  res.json(breakdownData);
});

export { getDashboardSummary, getCategoryBreakdown };
