import { mlmDb } from "./mlm-database";
import MonolineCommissionService from "./monoline-commission-service";
import { applyWalletTransactions } from "./wallet-transaction.service";
import LoggerService, { LogContext } from "./logger";

export async function fulfillProductPurchase(params: {
  productId: string;
  buyerEmail: string;
  referralCode?: string;
  shippingAddress: any;
  paymentMethod: string;
  totalAmount?: number;
  userId?: string;
}) {
  const { productId, buyerEmail, referralCode, shippingAddress, paymentMethod, totalAmount, userId } = params;

  try {
    // 1. Get product details
    const product = await mlmDb.getProductById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // 2. Resolve buyer ID if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const user = await mlmDb.getUserByEmail(buyerEmail);
      finalUserId = user?.id;
    }

    // 3. Create purchase record
    const result = await mlmDb.createProductPurchase({
      productId,
      buyerId: finalUserId,
      buyerEmail,
      referralCode,
      shippingAddress,
      paymentMethod,
    });

    if (!result.success) {
      throw new Error(`Failed to create purchase record: ${result.error}`);
    }

    // 4. Distribute commissions
    const purchaseAmount = totalAmount || product.price;
    const allUsers = await mlmDb.getAllUsers();

    LoggerService.info(`💰 Processing Commissions for Fulfill: ${product.name}`, { 
      context: LogContext.COMMISSION,
      productId,
      buyerEmail
    });

    const commissionResult = await MonolineCommissionService.calculateMonolineCommissions(
      finalUserId || 'anonymous',
      purchaseAmount,
      allUsers as any
    );

    // Apply transactions
    if (commissionResult.transactions.length > 0) {
      const walletTxs = commissionResult.transactions.map(t => ({
        userId: t.userId,
        amount: t.amount,
        type: t.type === 'direct' ? 'SPONSOR' : 'CAREER',
        reference: t.reference || `COMM-${Date.now()}-${t.userId}`,
        description: t.description || `Ürün komisyonu: ${product.name}`
      }));

      await applyWalletTransactions(walletTxs as any);

      // --- STRIPE CONNECT INTEGRATION ---
      // If a recipient has a Stripe Connected Account, we could potentially automate the payout here
      // But usually, payouts are batched or on-demand.
    }

    // Add to system pools
    await MonolineCommissionService.addToSystemPools(
      commissionResult.passivePoolAmount,
      commissionResult.companyFundAmount,
      `PURCHASE-${result.purchase?.id || Date.now()}`
    );

    // 5. Award Points & Career
    if (finalUserId) {
      const buyer = await mlmDb.getUserById(finalUserId);
      if (buyer && buyer.sponsorId) {
        try {
          const PointsCareerService = (await import('./points-career-service')).default;
          await PointsCareerService.awardSalePoints(
            buyer.sponsorId,
            purchaseAmount,
            'product',
            allUsers as any
          );
        } catch (err) {
          LoggerService.error('Error awarding points during fulfillment', { error: err });
        }
      }
    }

    return { success: true, purchaseId: result.purchase?.id };
  } catch (error) {
    LoggerService.error('Fulfillment error', { error, productId, buyerEmail });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
