import mongoose from 'mongoose';

const paymentTypeSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const PaymentType = mongoose.model('PaymentType', paymentTypeSchema);

export default PaymentType;