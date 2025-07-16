import mongoose from 'mongoose';
import { add } from 'date-fns';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';
import logger from '../utils/logger.js';

const calculateNextOccurrence = (currentNextDate, frequency) => {
    switch (frequency) {
        case 'daily':
            return add(currentNextDate, { days: 1 });
        case 'weekly':
            return add(currentNextDate, { weeks: 1 });
        case 'monthly':
            return add(currentNextDate, { months: 1 });
        case 'yearly':
            return add(currentNextDate, { years: 1 });
        default:
            throw new Error(`Frequência desconhecida: ${frequency}`);
    }
};

const processJobs = async () => {
    logger.logEvent('INFO', 'Iniciando o processamento de transações recorrentes via trigger...');
    
    const now = new Date();
    const dueTransactions = await RecurringTransaction.find({
        nextOccurrenceDate: { $lte: now }
    });

    if (dueTransactions.length === 0) {
        logger.logEvent('INFO', 'Nenhuma transação recorrente pendente encontrada.');
        return { success: true, message: 'Nenhuma tarefa pendente.' };
    }

    logger.logEvent('INFO', `Encontradas ${dueTransactions.length} transações recorrentes para processar.`);
    let processedCount = 0;

    for (const recurringTx of dueTransactions) {
        if (recurringTx.endDate && now > recurringTx.endDate) {
            logger.logEvent('INFO', `Deletando recorrência expirada: ${recurringTx.description}`);
            await recurringTx.deleteOne();
            continue;
        }
        
        const newTransaction = new Transaction({
            user: recurringTx.user,
            type: recurringTx.type,
            description: recurringTx.description,
            amount: recurringTx.amount,
            date: recurringTx.nextOccurrenceDate,
            category: recurringTx.category,
            notes: `Lançamento automático da recorrência: ${recurringTx.description}`
        });

        await newTransaction.save();
        logger.logEvent('AUTH', `Transação criada para a recorrência: ${recurringTx.description}`);

        const newNextOccurrenceDate = calculateNextOccurrence(recurringTx.nextOccurrenceDate, recurringTx.frequency);
        
        if (recurringTx.endDate && newNextOccurrenceDate > recurringTx.endDate) {
            logger.logEvent('INFO', `Deletando recorrência finalizada: ${recurringTx.description}`);
            await recurringTx.deleteOne();
        } else {
            recurringTx.nextOccurrenceDate = newNextOccurrenceDate;
            await recurringTx.save();
        }
        processedCount++;
    }

    const resultMessage = `Processamento finalizado. ${processedCount} transações processadas.`;
    logger.logEvent('INFO', resultMessage);
    return { success: true, message: resultMessage, processed: processedCount };
};

export { processJobs };