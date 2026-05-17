import express from 'express';
import mongoose from 'mongoose';
import { WalletTransaction } from '../lib/WalletTransaction';
import { User } from '../lib/User';
import { isAdmin } from '../lib/isAdmin';

const router = express.Router();

// Tüm HELD (Bekleyen) kazançları listele
router.get('/held-earnings', isAdmin, async (req, res) => {
  try {
    // userId referansını populate ederek kullanıcı detaylarını da çekiyoruz
    const heldTx = await WalletTransaction.find({ status: 'HELD' })
      .populate('userId', 'fullName email memberId')
      .sort({ createdAt: -1 });
      
    res.json(heldTx);
  } catch (err: any) {
    console.error('Error fetching held earnings:', err);
    res.status(500).json({ error: err.message });
  }
});

// Seçili HELD kazançları serbest bırak (Force Release)
router.post('/release-earnings', isAdmin, async (req, res) => {
  const { transactionIds } = req.body;

  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    return res.status(400).json({ error: 'Transaction IDs required' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Sadece HELD statüsündeki ve ID'si eşleşen işlemleri bul
    const transactions = await WalletTransaction.find({
      _id: { $in: transactionIds },
      status: 'HELD'
    }).session(session);

    let releasedCount = 0;

    for (const tx of transactions) {
      const user = await User.findById(tx.userId).session(session);
      if (user) {
        // 1. Cüzdan bakiyelerini güncelle (Limit kontrolü yapmadan ekle)
        user.wallet.balance += tx.amount;
        user.wallet.totalEarnings += tx.amount;
        
        // Bonus tipine göre alt kırılımları güncelle
        if (tx.type === 'SPONSOR') user.wallet.sponsorBonus += tx.amount;
        if (tx.type === 'CAREER') user.wallet.careerBonus += tx.amount;
        if (tx.type === 'LEADERSHIP') user.wallet.leadershipBonus += tx.amount;

        await user.save({ session });

        // 2. Transaction durumunu güncelle
        tx.status = 'PAID';
        tx.description = (tx.description || '') + ' [Admin Onaylı]';
        await tx.save({ session });
        
        releasedCount++;
      }
    }

    await session.commitTransaction();
    res.json({ success: true, released: releasedCount, message: `${releasedCount} işlem serbest bırakıldı.` });

  } catch (err: any) {
    await session.abortTransaction();
    console.error('Release held earnings failed:', err);
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

export default router;