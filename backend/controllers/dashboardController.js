/*
 * Corrigido o erro de exportação e implementada a busca de dados para o gráfico de pizza.
 * - A função getCategoryBreakdown foi adicionada e exportada corretamente.
 * - Corrigidas as chamadas de logger para usar o novo método logEvent.
 * - Adicionada a função getDashboardForecast para previsão de gastos recorrentes.
 * - Lógica da função getDashboardForecast totalmente refeita para calcular todas as ocorrências futuras dentro de um mês.
 * - A função getDashboardForecast agora também projeta dados para os gráficos (gastos diários e top categorias).
 * - A função getDashboardSummary agora inclui transações recorrentes no cálculo total.
 * - As funções getDashboardSummary e getCategoryBreakdown agora retornam a cor da categoria.
 */
import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { add } from 'date-fns';

const projectNextOccurrence = (currentDate, frequency) => {
    switch (frequency) {
        case 'daily': return add(currentDate, { days: 1 });
        case 'weekly': return add(currentDate, { weeks: 1 });
        case 'monthly': return add(currentDate, { months: 1 });
        case 'yearly': return add(currentDate, { years: 1 });
        default: throw new Error(`Frequência desconhecida: ${frequency}`);
    }
};

const getDailyExpensesForMonth = async (userId, year, month, recurringExpenses) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const dailyExpensesData = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lt: endDate }, type: 'expense' } },
    { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } },
    { $sort: { '_id': 1 } },
  ]);

  const expensesMap = new Map(dailyExpensesData.map(d => [d._id, d.total]));
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    amount: expensesMap.get(i + 1) || 0
  }));

  recurringExpenses.forEach(item => {
    const dayIndex = item.day - 1;
    if (dayIndex >= 0 && dayIndex < daysInMonth) {
      dailyTotals[dayIndex].amount += item.amount;
    }
  });

  return dailyTotals;
};

const getDashboardSummary = asyncHandler(async (req, res) => {
    const { year, month } = req.params;
    const { compareYear, compareMonth } = req.query;
    const userId = req.user._id;

    logger.logEvent('INFO', `User ${userId} fetching dashboard summary for ${month}/${year}.`);

    const numYear = parseInt(year);
    const numMonth = parseInt(month) - 1;

    const startDate = new Date(Date.UTC(numYear, numMonth, 1));
    const endDate = new Date(Date.UTC(numYear, numMonth + 1, 1));
    const monthEndDate = new Date(Date.UTC(numYear, numMonth + 1, 0, 23, 59, 59));
    
    // 1. Apurar transações normais
    const matchUserAndDate = {
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate, $lt: endDate }
    };

    const totals = await Transaction.aggregate([
      { $match: matchUserAndDate },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    let totalIncome = totals.find(t => t._id === 'income')?.total || 0;
    let totalExpenses = totals.find(t => t._id === 'expense')?.total || 0;

    const topCategoriesAgg = await Transaction.aggregate([
        { $match: { ...matchUserAndDate, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: [ '$categoryInfo.name', 'Sem Categoria' ] }, total: '$total', color: '$categoryInfo.color' } }
    ]);

    // 2. Apurar transações recorrentes
    const recurringTransactions = await RecurringTransaction.find({
        user: new mongoose.Types.ObjectId(userId),
        startDate: { $lte: monthEndDate },
        $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: startDate } }]
    });

    let recurringIncomeTotal = 0;
    let recurringExpensesTotal = 0;
    let recurringDailyExpenses = [];

    recurringTransactions.forEach(tx => {
        let currentDate = new Date(tx.startDate);
        while (currentDate < startDate) {
            const next = projectNextOccurrence(currentDate, tx.frequency);
            if (next <= currentDate) break;
            currentDate = next;
        }
        
        while (currentDate <= monthEndDate) {
            if (!tx.endDate || currentDate <= new Date(tx.endDate)) {
                 if (tx.type === 'income') {
                    recurringIncomeTotal += tx.amount;
                } else {
                    recurringExpensesTotal += tx.amount;
                    recurringDailyExpenses.push({ day: currentDate.getUTCDate(), amount: tx.amount });
                }
            }
            const next = projectNextOccurrence(currentDate, tx.frequency);
            if (next <= currentDate) break;
            currentDate = next;
        }
    });

    // 3. Somar totais
    totalIncome += recurringIncomeTotal;
    totalExpenses += recurringExpensesTotal;

    // 4. Consolidar Top Categorias
    let topCategories = [...topCategoriesAgg];
    if (recurringExpensesTotal > 0) {
        topCategories.push({ name: 'Recorrências', total: recurringExpensesTotal });
    }
    topCategories.sort((a, b) => b.total - a.total);
    topCategories = topCategories.slice(0, 5);
    
    const balance = totalIncome - totalExpenses;
    const dailyExpenses = await getDailyExpensesForMonth(userId, numYear, numMonth + 1, recurringDailyExpenses);
    
    let comparisonDailyExpenses = null;
    if (compareYear && compareMonth) {
      logger.logEvent('INFO', `Fetching comparison data for ${compareMonth}/${compareYear}`);
      comparisonDailyExpenses = await getDailyExpensesForMonth(userId, parseInt(compareYear), parseInt(compareMonth), []);
    }
  
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
    const monthEndDate = new Date(Date.UTC(year, parseInt(month), 0, 23, 59, 59));
    const matchUserAndDate = { user: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lt: endDate } };

    const expenses = await Transaction.aggregate([
        { $match: { ...matchUserAndDate, type: 'expense' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: [ '$categoryInfo.name', 'Sem Categoria' ] }, total: '$total', color: '$categoryInfo.color' } }
    ]);
    
    const recurringTransactions = await RecurringTransaction.find({
        user: new mongoose.Types.ObjectId(userId),
        startDate: { $lte: monthEndDate },
        $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: startDate } }],
        type: 'expense'
    });
    
    let recurringExpensesTotal = 0;
    recurringTransactions.forEach(tx => {
        let currentDate = new Date(tx.startDate);
        while (currentDate < startDate) {
            const next = projectNextOccurrence(currentDate, tx.frequency);
            if (next <= currentDate) break;
            currentDate = next;
        }
        while (currentDate <= monthEndDate) {
            if (!tx.endDate || currentDate <= new Date(tx.endDate)) {
                recurringExpensesTotal += tx.amount;
            }
            const next = projectNextOccurrence(currentDate, tx.frequency);
            if (next <= currentDate) break;
            currentDate = next;
        }
    });

    if (recurringExpensesTotal > 0) {
        expenses.push({ name: 'Recorrências', total: recurringExpensesTotal });
    }

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

const getDashboardForecast = asyncHandler(async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user._id;

    logger.logEvent('INFO', `[FORECAST] User ${userId} fetching forecast for ${month}/${year}.`);

    const numYear = parseInt(year);
    const numMonth = parseInt(month) - 1;

    const monthStartDate = new Date(Date.UTC(numYear, numMonth, 1));
    const monthEndDate = new Date(Date.UTC(numYear, numMonth + 1, 0, 23, 59, 59));
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const daysInMonth = new Date(Date.UTC(numYear, numMonth + 1, 0)).getUTCDate();
    const dailyExpenses = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
    const categoryTotals = new Map();

    const recurringTransactions = await RecurringTransaction.find({
        user: new mongoose.Types.ObjectId(userId),
        startDate: { $lte: monthEndDate },
        $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: monthStartDate } }
        ]
    }).populate('category', 'name color');

    recurringTransactions.forEach(tx => {
        let currentDate = new Date(tx.startDate);
        
        while (currentDate < monthStartDate) {
            const next = projectNextOccurrence(currentDate, tx.frequency);
            if (next <= currentDate) break; 
            currentDate = next;
        }
        
        while (currentDate <= monthEndDate) {
            if (!tx.endDate || currentDate <= new Date(tx.endDate)) {
                 if (tx.type === 'income') {
                    totalIncome += tx.amount;
                } else {
                    totalExpenses += tx.amount;
                    const dayOfMonth = currentDate.getUTCDate();
                    const dayIndex = dayOfMonth - 1;
                    if (dayIndex >= 0 && dayIndex < daysInMonth) {
                        dailyExpenses[dayIndex].amount += tx.amount;
                    }
                    if (tx.category) {
                        const categoryId = tx.category._id.toString();
                        const currentTotal = categoryTotals.get(categoryId) || { total: 0, name: tx.category.name, color: tx.category.color };
                        categoryTotals.set(categoryId, { ...currentTotal, total: currentTotal.total + tx.amount });
                    }
                }
            }
            const next = projectNextOccurrence(currentDate, tx.frequency);
            if (next <= currentDate) break;
            currentDate = next;
        }
    });

    const balance = totalIncome - totalExpenses;
    
    const topCategories = Array.from(categoryTotals.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({ name: c.name, total: c.total, color: c.color }));

    logger.logEvent('AUTH', `[FORECAST] Final forecast for ${month}/${year}: Income=${totalIncome.toFixed(2)}, Expenses=${totalExpenses.toFixed(2)}`);

    res.json({
        totalIncome,
        totalExpenses,
        balance,
        dailyExpenses,
        topCategories,
        comparisonDailyExpenses: null
    });
});


export { getDashboardSummary, getCategoryBreakdown, getDashboardForecast };