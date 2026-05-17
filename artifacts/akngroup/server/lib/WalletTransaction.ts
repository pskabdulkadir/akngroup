import mongoose from 'mongoose';

const WalletTransactionSchema = new mongoose.Schema({
  userId: {
    type: String, // Mevcut User ID'leri (string) ile uyumluluk için
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String, // SPONSOR, CAREER, TEAM, ADMIN, etc.
    required: true
  },
  status: {
    type: String,
    enum: ['PAID', 'HELD', 'BURNED'],
    default: 'PAID'
  },
  reference: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, { timestamps: true });

export const WalletTransaction =
  mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);
export default WalletTransaction;