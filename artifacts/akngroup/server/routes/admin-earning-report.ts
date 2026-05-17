import express from 'express';
import { WalletTransaction } from '../lib/WalletTransaction';
import { isAdmin } from '../lib/isAdmin';

const router = express.Router();

// Helper to format aggregation results into a structured object
const formatAggregate = (aggResult: any[]) => {
  const report: { [key: string]: number } = { PAID: 0, HELD: 0, BURNED: 0 };
  for (const item of aggResult) {
    if (report.hasOwnProperty(item._id)) {
      report[item._id] = item.total;
    }
  }
  return report;
};

// User-specific earnings report
router.get('/earnings/user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      startOfDay.getFullYear(),
      startOfDay.getMonth(),
      1
    );

    // Note: The user's schema uses a string ID, so we match it directly.
    const dailyTx = await WalletTransaction.aggregate([
      { $match: { userId: userId, createdAt: { $gte: startOfDay } } },
      { $group: { _id: '$status', total: { $sum: '$amount' } } }
    ]);

    const monthlyTx = await WalletTransaction.aggregate([
      { $match: { userId: userId, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$status', total: { $sum: '$amount' } } }
    ]);

    res.json({
      daily: formatAggregate(dailyTx),
      monthly: formatAggregate(monthlyTx)
    });

  } catch (err: any) {
    console.error('User earning report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// General report for all users' monthly earnings
router.get('/earnings/all', isAdmin, async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const report = await WalletTransaction.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$userId',
          paid: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
          held: { $sum: { $cond: [{ $eq: ['$status', 'HELD'] }, '$amount', 0] } },
          burned: { $sum: { $cond: [{ $eq: ['$status', 'BURNED'] }, '$amount', 0] } }
        }
      },
      {
        $lookup: {
          from: 'users', // Assumes the collection name is 'users'
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          fullName: '$userDetails.fullName',
          email: '$userDetails.email',
          package: '$userDetails.package',
          paid: 1,
          held: 1,
          burned: 1
        }
      },
      { $sort: { 'fullName': 1 } }
    ]);

    res.json(report);
  } catch (err: any) {
    console.error('All earnings report error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;