import express from 'express';
import { isAdmin } from './isAdmin';
import { calculateCommissionByAdmin } from './admin-commission-service';

const router = express.Router();

/**
 * POST /api/admin/commission/calculate (Mounted at /api/admin)
 * Admin-only endpoint to trigger monoline commission distribution.
 * This operation is atomic and idempotent.
 */
router.post(
  '/commission/calculate',
  isAdmin,
  async (req, res) => {
    try {
      const { userId, packageId, amount } = req.body;
      
      const result = await calculateCommissionByAdmin(
        userId,
        packageId,
        amount,
        req.user?.id
      );
      
      res.json(result);
    } catch (err: any) {
      console.error('Admin commission calculation failed:', err);
      res.status(400).json({ error: err.message || 'Calculation failed' });
    }
  }
);

export default router;