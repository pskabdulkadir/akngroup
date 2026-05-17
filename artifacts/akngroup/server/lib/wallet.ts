import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  userId: {
    type: String, // Mevcut User ID'leri (string) ile uyumluluk için
    ref: 'User',
    unique: true,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Hot-reload sırasında oluşabilecek hataları önlemek için
export const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
export default Wallet;