/*
 * Modelo de dados renomeado de 'Expense' para 'Transaction'.
 * - Adicionado o campo 'type' para diferenciar 'income' (receita) e 'expense' (despesa).
 * - O campo 'category' tornou-se opcional, pois se aplica principalmente a despesas.
 */
import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false, // Categoria não é obrigatória para receitas
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;