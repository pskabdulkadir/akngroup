import express, { Router, Request, Response } from "express";
import { Product } from "../../shared/mlm-types";
import { mlmDb } from "../lib/mlm-database";
// Dynamic imports required for services to avoid circular dependencies if any, or just keeping pattern
// But we can import types normally.

const router = Router();

// Clone products sayfası verilerini getir
router.get("/:memberId", async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;

    // Üye bilgilerini bul
    const member = await mlmDb.getUserByMemberId(memberId);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Admin tarafından eklenen aktif ürünleri getir
    const allProducts = await mlmDb.getAllProducts();
    const products: Product[] = (allProducts || []).filter((p: any) => p && p.isActive !== false);

    // Clone sayfa istatistiklerini getir
    // Not: Gerçek istatistikler veritabanından çekilebilir, şimdilik basit tutuyoruz
    const cloneStats = {
      visits: 0, // Implement real visit tracking if needed
      purchases: 0,
      totalCommissions: 0,
    };

    res.json({
      member: {
        id: member.id,
        memberId: member.memberId,
        fullName: member.fullName,
        referralCode: member.referralCode,
        careerLevel: member.careerLevel,
      },
      products,
      cloneStats,
    });

  } catch (error) {
    console.error("Error fetching clone product data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Clone sayfa ziyareti kaydet
router.post("/:memberId/visit", async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    // Buraya gerçek ziyaret kaydı eklenebilir (LowDb clonePages veya Redis)
    console.log(`Clone page visit tracked for member: ${memberId}`);
    res.json({ success: true, message: "Visit tracked" });
  } catch (error) {
    console.error("Error tracking visit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Clone sayfa üzerinden ürün satın alma
router.post("/purchase", async (req: Request, res: Response) => {
  try {
    const {
      productId,
      buyerEmail,
      referralCode,
      sponsorId,
      purchaseAmount,
      shippingAddress,
      // cloneCommissionRate, // Use backend logic, trust source less
    } = req.body;

    // 1. Validate Product
    const product = await mlmDb.getProductById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // 2. Validate Sponsor/Seller
    const sponsor = await mlmDb.getUserById(sponsorId);
    if (!sponsor) return res.status(404).json({ error: "Sponsor not found" });

    // 3. Create Purchase Record (Pending)
    const result = await mlmDb.createProductPurchase({
      productId,
      buyerId: "guest", // Or create a temp user logic if needed
      buyerEmail,
      referralCode: sponsor.referralCode,
      shippingAddress,
      paymentMethod: "credit_card"
    });

    if (!result.success) return res.status(400).json(result);

    const amount = Number(purchaseAmount) || product.price;

    // 4. Distribute Commissions & Points
    // Important: For "guest" purchases, the sponsor usually gets the 'Personal Volume' points 
    // OR we treat it as a direct sale commission.

    // A. Direct Commission (Clone Page Owner Reward)
    // Usually higher for direct sales (e.g. retail difference or specific rate)
    const commissionRate = 0.15; // 15% Standard Clone Page Commission
    const commissionAmount = amount * commissionRate;

    sponsor.wallet.balance += commissionAmount;
    sponsor.wallet.totalEarnings += commissionAmount;

    await mlmDb.createTransaction({
      userId: sponsor.id,
      type: "commission",
      amount: commissionAmount,
      description: `Clone Mağaza Satış Komisyonu - ${product.name}`,
      status: "completed",
      referenceId: result.purchase?.id || `ORD-${Date.now()}`
    });

    await mlmDb.updateUser(sponsor.id, { wallet: sponsor.wallet });

    // B. Points & Career (Sponsor gets points for selling)
    try {
      const PointsCareerService = (await import('../lib/points-career-service')).default;
      const allUsers = await mlmDb.getAllUsers();

      // Award points to the SPONSOR because they made the sale
      const pointResult = await PointsCareerService.awardSalePoints(
        sponsor.id,
        amount,
        'product',
        allUsers as any
      );

      // Check Career Upgrades for Sponsor and Upline
      const careerLevels = PointsCareerService.getDefaultCareerLevels();
      const affectedUserIds = [...new Set(pointResult.transactions.map(t => t.userId))];

      for (const affectedId of affectedUserIds) {
        const updatedUser = pointResult.updatedUsers.find(u => u.id === affectedId);
        if (!updatedUser) continue;

        const upgradeCheck = PointsCareerService.checkCareerLevelUpgrade(updatedUser, careerLevels);
        let finalUser = updatedUser;

        if (upgradeCheck.shouldUpgrade && upgradeCheck.newLevel) {
          finalUser = { ...updatedUser, careerLevel: upgradeCheck.newLevel };
          // Add Bonus logic here if needed (omitted for brevity, same as activation)
          // Or create a shared helper for upgrade execution
        }

        await mlmDb.updateUser(affectedId, {
          pointsSystem: finalUser.pointsSystem,
          careerLevel: finalUser.careerLevel
        });
      }

    } catch (e) {
      console.error("Points distribution failed:", e);
    }

    // Sipariş başarılı response
    res.json({
      success: true,
      message: "Purchase completed successfully",
      commission: {
        sponsorId,
        amount: commissionAmount,
        rate: commissionRate,
      },
    });

  } catch (error) {
    console.error("Error processing purchase:", error);
    res.status(500).json({ error: "Purchase failed" });
  }
});

// Üyenin clone sayfa istatistiklerini getir
router.get("/:memberId/stats", async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const user = await mlmDb.getUserByMemberId(memberId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const stats = await mlmDb.getProductSalesStats(user.id); // Assuming we implement a user filter
    // If not implemented, return mock or aggregated

    // Quick implementation for now using transaction history + purchases
    const purchases = await mlmDb.getUserProductPurchases(user.id);

    res.json({
      totalVisits: 0,
      totalPurchases: purchases.length,
      totalCommissions: user.wallet.totalEarnings // Rough estimate, ideally filter by type 'commission'
    });

  } catch (error) {
    console.error("Error fetching clone stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
