import express from 'express';
import { User } from '../lib/User';
import { WalletTransaction } from '../lib/WalletTransaction';
import { isAdmin } from '../lib/isAdmin';
import { FraudDetectionService } from '../lib/fraud-detection-service';

const router = express.Router();

router.get('/fraud-check', isAdmin, async (req, res) => {
  try {
    // Fetch all users and transactions
    // Note: In a large system, fetching all data might be heavy.
    const allUsersRaw = await User.find().lean();
    const allTx = await WalletTransaction.find().lean();

    // Map _id to id for compatibility with shared types
    const allUsers = allUsersRaw.map((u: any) => ({ ...u, id: u._id }));

    // Prepare transactions with sourceUserId derived from reference if possible
    // Reference format from admin-commission-service: `PKG-${sourceUserId}-${packageId}`
    const enrichedTx = allTx.map((tx: any) => {
        let sourceUserId = null;
        if (tx.reference && typeof tx.reference === 'string' && tx.reference.startsWith('PKG-')) {
            const parts = tx.reference.split('-');
            if (parts.length >= 2) {
                sourceUserId = parts[1];
            }
        }
        return { ...tx, sourceUserId };
    }).filter((tx: any) => tx.sourceUserId); // Only check transactions where we can identify source

    const fraudUsers: any[] = [];

    for (const user of allUsers) {
      const loopDetected = FraudDetectionService.detectLoop(user as any, allUsers as any[]);
      const selfBonus = FraudDetectionService.checkSelfOrDownlineBonus(user as any, allUsers as any[], enrichedTx);

      if (loopDetected || selfBonus) {
        fraudUsers.push({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            issues: {
                loopDetected,
                selfBonus
            }
        });
      }
    }

    res.json({ 
        success: true,
        fraudUsers, 
        count: fraudUsers.length,
        totalUsersScanned: allUsers.length
    });
  } catch (err: any) {
    console.error('Fraud check error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;