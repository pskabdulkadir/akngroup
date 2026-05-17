import { Router, Request, Response } from "express";
import { StripeService } from "../lib/stripe-service";
import { mlmDb } from "../lib/mlm-database";
import { verifyAccessToken } from "../lib/utils";
import LoggerService, { LogContext } from "../lib/logger";
import { fulfillProductPurchase } from "../lib/purchase-fulfillment";

const router = Router();

// 1. Get Onboarding Link
router.get("/onboarding-link", verifyAccessToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await mlmDb.getUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı" });
    }

    let stripeAccountId = user.stripeAccountId;

    // Create account if not exists
    if (!stripeAccountId) {
      const account = await StripeService.createConnectedAccount(user.email, userId);
      stripeAccountId = account.id;
      await mlmDb.updateUser(userId, { stripeAccountId });
    }

    const host = process.env.NODE_ENV === 'production' ? `https://${req.get('host')}` : 'http://localhost:3000';
    const returnUrl = `${host}/api/stripe/onboarding-complete?userId=${userId}`;
    const refreshUrl = `${host}/member-panel?tab=profile`;

    const accountLink = await StripeService.createAccountLink(stripeAccountId, returnUrl, refreshUrl);

    return res.json({ success: true, url: accountLink.url });
  } catch (error) {
    LoggerService.error("Stripe onboarding-link error", { error });
    return res.status(500).json({ success: false, error: "Stripe bağlantısı oluşturulamadı" });
  }
});

// 2. Onboarding Complete Callback
router.get("/onboarding-complete", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).send("Geçersiz kullanıcı ID");
    }

    const user = await mlmDb.getUserById(userId);
    if (!user || !user.stripeAccountId) {
      return res.status(404).send("Kullanıcı veya Stripe hesabı bulunamadı");
    }

    // Verify account status
    const account = await StripeService.retrieveAccount(user.stripeAccountId);
    
    if (account.details_submitted) {
      await mlmDb.updateUser(userId, { stripeOnboardingComplete: true });
    }

    // Redirect back to profile
    return res.redirect('/member-panel?tab=profile&stripe=success');
  } catch (error) {
    LoggerService.error("Stripe onboarding-complete error", { error });
    return res.redirect('/member-panel?tab=profile&stripe=error');
  }
});

// 3. Create Checkout Session for Products
router.post("/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const { productId, buyerEmail, metadata: extraMetadata } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Ürün ID gereklidir." });
    }

    const product = await mlmDb.getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Ürün bulunamadı." });
    }

    // Shipping cost calculation (placeholder - matching client logic)
    const shippingCost = extraMetadata?.shippingOption === 'express' ? 15 : 0;
    const totalAmount = product.price + shippingCost;

    const host = process.env.NODE_ENV === 'production' ? `https://${req.get('host')}` : 'http://localhost:3000';
    
    const session = await StripeService.createCheckoutSession({
      amount: totalAmount,
      description: product.name,
      metadata: {
        ...extraMetadata,
        productId,
        buyerEmail,
        type: 'product_purchase'
      },
      successUrl: `${host}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${host}/checkout?canceled=true`,
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    LoggerService.error("Stripe checkout session error", { error });
    return res.status(500).json({ success: false, error: "Ödeme sayfası oluşturulamadı" });
  }
});

// 4. Webhook Handler
router.post("/webhook", async (req: any, res: Response) => {
  const stripe = StripeService.getStripe();
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err: any) {
    LoggerService.error(`Webhook Signature verification failed`, { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      LoggerService.info('Stripe Checkout Session Completed', { sessionId: session.id, metadata: session.metadata });
      
      // Fulfillment logic
      if (session.metadata?.type === 'product_purchase') {
        const metadata = session.metadata;
        await fulfillProductPurchase({
          productId: metadata.productId,
          buyerEmail: metadata.buyerEmail,
          referralCode: metadata.referralCode,
          shippingAddress: JSON.parse(metadata.shippingAddress),
          paymentMethod: 'stripe',
          totalAmount: session.amount_total ? session.amount_total / 100 : undefined,
          userId: metadata.userId
        });
      }
      break;
    }

    case 'account.updated': {
      const account = event.data.object;
      if (account.details_submitted) {
        // Find user by stripeAccountId and update
        const users = await mlmDb.getAllUsers();
        const user = users.find((u: any) => u.stripeAccountId === account.id);
        if (user) {
          await mlmDb.updateUser(user.id, { stripeOnboardingComplete: true });
          LoggerService.info(`Stripe account onboarding verified for user ${user.id}`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
