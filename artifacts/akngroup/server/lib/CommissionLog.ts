import mongoose from 'mongoose';

const CommissionLogSchema = new mongoose.Schema({
  sourceUserId: {
    type: String, // Mevcut User ID yapısıyla uyumlu (String)
    ref: 'User',
    required: true
  },
  packageId: {
    type: String, // MembershipPackage ID
    required: true
  },
  reference: {
    type: String,
    required: true,
    unique: true, // Bu referansla tekrar işlem yapılmasını engeller
    index: true   // Hızlı sorgulama için index
  },
  // amount ve createdByAdmin alanlarını opsiyonel yapıyoruz veya koruyoruz
  // Yeni akışta log kaydı sırasında bu bilgiler her zaman geçilmeyebilir
  // ancak geriye dönük uyumluluk için şemada tutuyoruz.
  amount: { type: Number },
  createdByAdmin: {
    type: String, // Mevcut User ID yapısıyla uyumlu (String)
    ref: 'User',
  } 
}, { timestamps: true });

// Hot-reload sırasında oluşabilecek hataları önlemek için
export const CommissionLog =
  mongoose.models.CommissionLog || mongoose.model('CommissionLog', CommissionLogSchema);

export default CommissionLog;