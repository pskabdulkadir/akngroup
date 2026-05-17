import mongoose from 'mongoose';
import { MonolineCommissionService } from './monoline-commission-service';
import { applyWalletTransactions } from './wallet-transaction.service';
import { CommissionLog } from './CommissionLog';

export async function calculateCommissionByAdmin(
  sourceUserId: string,
  packageId: string,
  amount: number,
  adminId?: string
) {

  const reference = `PKG-${sourceUserId}-${packageId}`;

  // 🔒 Daha önce dağıtıldı mı?
  const exists = await CommissionLog.findOne({ reference });
  if (exists) {
    throw new Error('Commission already calculated for this package purchase');
  }

  // 🔗 Monoline zinciri
  const chain = await MonolineCommissionService.getMonolineChain(sourceUserId, 5);

  // Komisyon oranları: Level 1 (Sponsor) %10, Level 2 %5, Level 3 %3, Level 4 %2, Level 5 %1
  const rates = [0.1, 0.05, 0.03, 0.02, 0.01];

  const transactions = chain.map((upline, index) => {
    if (index >= rates.length) return null;
    
    return {
      userId: upline.userId,
      amount: amount * rates[index],
      type: index === 0 ? 'SPONSOR' : 'CAREER',
      reference,
      description: `Admin manual calc: Level ${index + 1} commission`
    };
  }).filter(t => t !== null) as any[];

  if (transactions.length === 0) {
    return {
      success: true,
      distributed: 0,
      message: "No eligible upline found for commission distribution."
    };
  }

  // 💰 Wallet + Transaction + Limit
  // applyWalletTransactions kendi transaction session'ını yönetir.
  await applyWalletTransactions(transactions);

  // 🧾 Log (Çakışma engeli için kaydı oluştur)
  await CommissionLog.create({
    sourceUserId,
    packageId,
    reference,
    amount: transactions.reduce((sum, t) => sum + t.amount, 0), // Toplam dağıtılan
    createdByAdmin: adminId || 'system'
  });

  return {
    success: true,
    distributed: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0)
  };
}