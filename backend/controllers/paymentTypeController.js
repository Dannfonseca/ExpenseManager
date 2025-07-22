import asyncHandler from 'express-async-handler';
import PaymentType from '../models/PaymentType.js';
import Transaction from '../models/Transaction.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const paymentTypeSchema = z.object({
    name: z.string().min(1, 'O nome do tipo de pagamento é obrigatório.'),
});

const getPaymentTypes = asyncHandler(async (req, res) => {
  logger.logEvent('INFO', `User ${req.user._id} fetching payment types.`);
  const paymentTypes = await PaymentType.find({ user: req.user._id });
  logger.logEvent('INFO', `Found ${paymentTypes.length} payment types for user ${req.user._id}.`);
  res.json(paymentTypes);
});

const createPaymentType = asyncHandler(async (req, res) => {
  const { name } = paymentTypeSchema.parse(req.body);

  logger.logEvent('INFO', `User ${req.user._id} creating payment type with name "${name}".`);
  const paymentType = new PaymentType({
    user: req.user._id,
    name,
  });

  const createdPaymentType = await paymentType.save();
  logger.logEvent('INFO', `Payment type "${name}" created with ID ${createdPaymentType._id} for user ${req.user._id}.`);
  res.status(201).json(createdPaymentType);
});

const updatePaymentType = asyncHandler(async (req, res) => {
    const { name } = paymentTypeSchema.parse(req.body);
    const paymentTypeId = req.params.id;

    logger.logEvent('INFO', `User ${req.user._id} attempting to update payment type ${paymentTypeId}.`);
    const paymentType = await PaymentType.findById(paymentTypeId);

    if (paymentType && paymentType.user.toString() === req.user._id.toString()) {
        paymentType.name = name || paymentType.name;

        const updatedPaymentType = await paymentType.save();
        logger.logEvent('INFO', `Payment type ${paymentTypeId} updated successfully for user ${req.user._id}.`);
        res.json(updatedPaymentType);
    } else {
        logger.logEvent('INFO', `Update failed: Payment type ${paymentTypeId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Tipo de pagamento não encontrado.');
    }
});

const deletePaymentType = asyncHandler(async (req, res) => {
    const paymentTypeId = req.params.id;
    logger.logEvent('INFO', `User ${req.user._id} attempting to delete payment type ${paymentTypeId}.`);
    const paymentType = await PaymentType.findById(paymentTypeId);

    if (paymentType && paymentType.user.toString() === req.user._id.toString()) {
        await Transaction.updateMany({ paymentType: paymentTypeId }, { $unset: { paymentType: "" } });
        await RecurringTransaction.updateMany({ paymentType: paymentTypeId }, { $unset: { paymentType: "" } });
        logger.logEvent('INFO', `Unset payment type ${paymentTypeId} from all associated transactions.`);
        
        await paymentType.deleteOne();
        logger.logEvent('INFO', `Payment type ${paymentTypeId} deleted successfully for user ${req.user._id}.`);
        res.json({ message: 'Tipo de pagamento removido.' });
    } else {
        logger.logEvent('INFO', `Delete failed: Payment type ${paymentTypeId} not found or user ${req.user._id} not authorized.`);
        res.status(404);
        throw new Error('Tipo de pagamento não encontrado.');
    }
});

export { getPaymentTypes, createPaymentType, updatePaymentType, deletePaymentType };