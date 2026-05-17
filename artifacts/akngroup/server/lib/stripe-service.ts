import Stripe from 'stripe';
import LoggerService, { LogContext } from './logger';

export class StripeService {
  private static stripe: Stripe;

  static getStripe() {
    if (!this.stripe) {
      const apiKey = process.env.STRIPE_SECRET_KEY;
      if (!apiKey) {
        console.warn('⚠️ STRIPE_SECRET_KEY is not configured — payment features disabled');
        throw new Error('Stripe ödeme sistemi henüz yapılandırılmamış. Lütfen yöneticiye başvurun.');
      }
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2023-10-16' as any,
      });
    }
    return this.stripe;
  }

  static async createConnectedAccount(email: string, userId: string) {
    try {
      const stripe = this.getStripe();
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'TR',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          userId: userId,
        },
      });
      return account;
    } catch (error) {
      LoggerService.error('Stripe createConnectedAccount error', { error });
      throw error;
    }
  }

  static async createAccountLink(stripeAccountId: string, returnUrl: string, refreshUrl: string) {
    try {
      const stripe = this.getStripe();
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      return accountLink;
    } catch (error) {
      LoggerService.error('Stripe createAccountLink error', { error });
      throw error;
    }
  }

  static async createCheckoutSession(params: {
    amount: number;
    currency?: string;
    description: string;
    metadata: any;
    successUrl: string;
    cancelUrl: string;
    connectedAccountId?: string;
  }) {
    try {
      const stripe = this.getStripe();
      const { amount, currency = 'usd', description, metadata, successUrl, cancelUrl, connectedAccountId } = params;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: description,
              },
              unit_amount: Math.round(amount * 100), // convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata,
      };

      // If we want to take a fee and send rest to connected account (Direct Charge or Destination Charge)
      // For now, we take full payment to platform and distribute later (Transfer)
      // This is simpler for MLM where multiple people get paid.

      const session = await stripe.checkout.sessions.create(sessionParams);
      return session;
    } catch (error) {
      LoggerService.error('Stripe createCheckoutSession error', { error });
      throw error;
    }
  }

  static async transferToConnectedAccount(amount: number, connectedAccountId: string, description: string) {
    try {
      const stripe = this.getStripe();
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: connectedAccountId,
        description: description,
      });
      return transfer;
    } catch (error) {
      LoggerService.error('Stripe transferToConnectedAccount error', { error });
      throw error;
    }
  }

  static async retrieveAccount(stripeAccountId: string) {
    const stripe = this.getStripe();
    return await stripe.accounts.retrieve(stripeAccountId);
  }
}

export default StripeService;
