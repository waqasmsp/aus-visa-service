import {
  CapturePaymentIntentDto,
  CreatePaymentIntentDto,
  CreateRefundDto,
  CreateSubscriptionDto,
  HandleWebhookDto,
  RequestContext
} from '../dtos';
import { PaymentsAdapter } from '../interfaces';
import { Charge, Dispute, PaymentIntent, Refund, Subscription, WebhookEvent } from '../models';
import { StripeAdapter } from './stripe.adapter';

/**
 * Google Pay commonly flows through a PSP tokenization path (for example Stripe).
 * This adapter delegates lifecycle operations to Stripe unless a direct acquiring contract exists.
 */
export class GooglePayAdapter implements PaymentsAdapter {
  readonly provider = 'googlepay' as const;

  constructor(private readonly delegatedProcessor: PaymentsAdapter = new StripeAdapter()) {}

  async createIntent(input: CreatePaymentIntentDto, context: RequestContext): Promise<PaymentIntent> {
    const intent = await this.delegatedProcessor.createIntent(input, context);
    return { ...intent, provider: this.provider };
  }

  async captureIntent(input: CapturePaymentIntentDto, context: RequestContext): Promise<Charge> {
    const charge = await this.delegatedProcessor.captureIntent(input, context);
    return { ...charge, provider: this.provider };
  }

  async createRefund(input: CreateRefundDto, context: RequestContext): Promise<Refund> {
    const refund = await this.delegatedProcessor.createRefund(input, context);
    return { ...refund, provider: this.provider };
  }

  async createSubscription(input: CreateSubscriptionDto, context: RequestContext): Promise<Subscription> {
    const subscription = await this.delegatedProcessor.createSubscription(input, context);
    return { ...subscription, provider: this.provider };
  }

  async listDisputes(context: RequestContext): Promise<Dispute[]> {
    const disputes = await this.delegatedProcessor.listDisputes(context);
    return disputes.map((dispute) => ({ ...dispute, provider: this.provider }));
  }

  async parseWebhook(input: HandleWebhookDto, context: RequestContext): Promise<WebhookEvent> {
    const event = await this.delegatedProcessor.parseWebhook(input, context);
    return { ...event, provider: this.provider };
  }
}
