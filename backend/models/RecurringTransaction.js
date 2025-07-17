import mongoose from 'mongoose';

const recurringTransactionSchema = mongoose.Schema({
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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  },
  paymentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentType',
    required: false,
  },
  notes: {
    type: String,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
    default: 'monthly',
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: false,
  },
  nextOccurrenceDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema);

export default RecurringTransaction;