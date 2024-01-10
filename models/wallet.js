const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  // Add any other fields you need to track for transactions
}, {
  timestamps: true,
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  transactions: [transactionSchema],

  pendingOrder: {
    orderId: {
      type: String,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

const WalletModel = mongoose.model('Wallet', walletSchema);
module.exports = WalletModel
